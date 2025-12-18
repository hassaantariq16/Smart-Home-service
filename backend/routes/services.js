const express = require('express');
const Service = require('../models/Service');
const { authenticate } = require('../middleware/auth');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { getNeo4jSession } = require('../config/neo4j');
const { validate, searchServicesSchema } = require('../middleware/validation');

const router = express.Router();

// Search services
router.get('/search', authenticate, validate(searchServicesSchema, 'query'), async (req, res) => {
  try {
    const { q, category, minRating, maxPrice, page = 1, limit = 20 } = req.query;

    let services;

    if (q) {
      // Use Elasticsearch for full-text search
      const esClient = getElasticsearchClient();

      try {
        const result = await esClient.search({
          index: 'services',
          body: {
            query: {
              bool: {
                must: [
                  {
                    multi_match: {
                      query: q,
                      fields: ['name^3', 'description^2', 'features', 'category'],
                      fuzziness: 'AUTO'
                    }
                  }
                ],
                filter: [
                  ...(category ? [{ term: { category } }] : []),
                  ...(minRating ? [{ range: { 'rating.average': { gte: parseFloat(minRating) } } }] : []),
                  ...(maxPrice ? [{ range: { 'pricing.amount': { lte: parseFloat(maxPrice) } } }] : [])
                ]
              }
            },
            from: (page - 1) * limit,
            size: limit,
            sort: [{ _score: 'desc' }, { 'rating.average': 'desc' }]
          }
        });

        const serviceIds = result.hits.hits.map(hit => hit._source.serviceId);
        services = await Service.find({ serviceId: { $in: serviceIds }, isActive: true });

      } catch (esError) {
        console.error('Elasticsearch error, falling back to MongoDB:', esError.message);
        // Fallback to MongoDB text search
        services = await Service.find({
          $text: { $search: q },
          isActive: true,
          ...(category && { category }),
          ...(minRating && { 'rating.average': { $gte: parseFloat(minRating) } }),
          ...(maxPrice && { 'pricing.amount': { $lte: parseFloat(maxPrice) } })
        })
          .limit(parseInt(limit))
          .skip((page - 1) * limit);
      }

    } else {
      // Simple MongoDB query
      const query = {
        isActive: true,
        ...(category && { category }),
        ...(minRating && { 'rating.average': { $gte: parseFloat(minRating) } }),
        ...(maxPrice && { 'pricing.amount': { $lte: parseFloat(maxPrice) } })
      };

      services = await Service.find(query)
        .sort({ 'rating.average': -1 })
        .limit(parseInt(limit))
        .skip((page - 1) * limit);
    }

    res.json({
      success: true,
      count: services.length,
      page: parseInt(page),
      data: services
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching services',
      error: error.message
    });
  }
});

// Get service details
router.get('/:serviceId', authenticate, async (req, res) => {
  try {
    const service = await Service.findOne({
      serviceId: req.params.serviceId,
      isActive: true
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Increment view count
    service.stats.views += 1;
    await service.save();

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service'
    });
  }
});

// Get personalized recommendations
router.get('/recommendations/personalized', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const session = getNeo4jSession();

    try {
      // Get recommendations from Neo4j using collaborative filtering
      const result = await session.run(`
        MATCH (u:User {userId: $userId})-[:SUBSCRIBED_TO]->(s:Service)
        MATCH (s)<-[:SUBSCRIBED_TO]-(other:User)
        MATCH (other)-[:SUBSCRIBED_TO]->(rec:Service)
        WHERE NOT (u)-[:SUBSCRIBED_TO]->(rec)
        WITH rec, COUNT(DISTINCT other) as commonUsers
        ORDER BY commonUsers DESC
        LIMIT 10
        RETURN rec.serviceId as serviceId, commonUsers
      `, { userId: userId.toString() });

      const recommendedIds = result.records.map(record => record.get('serviceId'));

      let services;
      let algorithm = 'top-rated';

      if (recommendedIds.length > 0) {
        services = await Service.find({
          serviceId: { $in: recommendedIds },
          isActive: true
        });
        algorithm = 'collaborative-filtering';
      }

      // If no graph recommendations or not enough, add top-rated services
      if (!services || services.length < 3) {
        const topRated = await Service.find({ isActive: true })
          .sort({ 'rating.average': -1, 'stats.subscribers': -1 })
          .limit(6);
        services = services && services.length > 0 ? [...services, ...topRated].slice(0, 6) : topRated;
      }

      res.json({
        success: true,
        count: services.length,
        data: services,
        algorithm: algorithm,
        note: algorithm === 'top-rated' ? 'Showing top-rated services' : 'Personalized based on similar users'
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Get recommendations error:', error);

    // Even on error, return top-rated services so frontend always has data
    try {
      const services = await Service.find({ isActive: true })
        .sort({ 'rating.average': -1 })
        .limit(6);

      res.json({
        success: true,
        count: services.length,
        data: services,
        algorithm: 'fallback-top-rated',
        note: 'Showing popular services'
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Error fetching recommendations',
        error: error.message
      });
    }
  }
});

// Subscribe to service
router.post('/:serviceId/subscribe', authenticate, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user.userId;

    // Check if service exists
    const service = await Service.findOne({ serviceId, isActive: true });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Create subscription relationship in Neo4j
    const session = getNeo4jSession();

    try {
      await session.run(`
        MERGE (u:User {userId: $userId})
        MERGE (s:Service {serviceId: $serviceId})
        MERGE (u)-[r:SUBSCRIBED_TO {timestamp: datetime()}]->(s)
        RETURN r
      `, {
        userId: userId.toString(),
        serviceId
      });

      // Update service stats
      service.stats.subscribers += 1;
      service.stats.installations += 1;
      await service.save();

      res.json({
        success: true,
        message: 'Subscribed to service successfully',
        data: service
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error subscribing to service',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Service.countDocuments({ category, isActive: true });
        return { name: category, count };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;
