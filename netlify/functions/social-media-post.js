const localDB = require('./local-db');
localDB.initDB();

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get scheduled posts or post history
      const posts = localDB.read('social_posts') || [];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ posts })
      };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (data.action === 'schedule') {
        // Schedule a new post
        const posts = localDB.read('social_posts') || [];
        const newPost = {
          id: Date.now().toString(),
          content: data.content,
          service: data.service,
          level: data.level,
          platforms: data.platforms || ['twitter', 'linkedin', 'facebook', 'instagram'],
          scheduledTime: data.scheduledTime,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };
        posts.push(newPost);
        localDB.write('social_posts', posts);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, post: newPost })
        };
      }
      
      if (data.action === 'post_now') {
        // Post immediately
        const results = [];
        const content = data.content;
        
        // Simulate posting to platforms
        for (const platform of (data.platforms || ['twitter', 'linkedin', 'facebook', 'instagram'])) {
          results.push({
            platform,
            success: true,
            message: `Posted to ${platform} (simulated)`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Save to history
        const posts = localDB.read('social_posts') || [];
        const historyPost = {
          id: Date.now().toString(),
          content: data.content,
          service: data.service,
          level: data.level,
          platforms: data.platforms,
          status: 'posted',
          postedAt: new Date().toISOString(),
          results
        };
        posts.push(historyPost);
        localDB.write('social_posts', posts);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, results })
        };
      }
      
      if (data.action === 'get_templates') {
        // Return available templates
        const templates = {
          services: [
            { id: 'security-assessments', name: 'Security Assessments' },
            { id: 'vulnerability-scanning', name: 'Vulnerability Scanning' },
            { id: 'incident-response', name: 'Incident Response' },
            { id: 'digital-forensics', name: 'Digital Forensics' },
            { id: 'it-solutions', name: 'IT Solutions' },
            { id: 'training-awareness', name: 'Training & Awareness' }
          ],
          levels: ['beginner', 'intermediate', 'advanced'],
          platforms: ['twitter', 'linkedin', 'facebook', 'instagram']
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ templates })
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request' })
    };
  } catch (error) {
    console.error('Social media post error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};