// Artillery load test processor for custom metrics and validation

module.exports = {
  // Custom functions available in scenarios
  $randomString,
  $randomBook,
  
  // Hook functions for custom metrics
  beforeRequest,
  afterResponse,
  beforeScenario,
  afterScenario,
};

// Generate random search strings
function $randomString() {
  const searches = [
    'fiction',
    'non-fiction',
    'biography',
    'science',
    'history',
    'romance',
    'thriller',
    'fantasy',
    'mystery',
    'self-help'
  ];
  return searches[Math.floor(Math.random() * searches.length)];
}

// Generate random book titles for testing
function $randomBook() {
  const books = [
    'The Great Gatsby',
    'To Kill a Mockingbird',
    '1984',
    'Pride and Prejudice',
    'The Catcher in the Rye',
    'Lord of the Flies',
    'Jane Eyre',
    'The Hobbit',
    'Fahrenheit 451',
    'Brave New World'
  ];
  return books[Math.floor(Math.random() * books.length)];
}

// Custom metrics tracking
const customMetrics = {
  slowRequests: 0,
  errorRequests: 0,
  totalRequests: 0,
  searchRequests: 0,
  homePageViews: 0,
};

function beforeRequest(requestParams, context, ee, next) {
  customMetrics.totalRequests++;
  
  // Track specific request types
  if (requestParams.url.includes('/search')) {
    customMetrics.searchRequests++;
  } else if (requestParams.url === '/') {
    customMetrics.homePageViews++;
  }
  
  // Add timestamp for response time tracking
  context.vars.requestStartTime = Date.now();
  
  return next();
}

function afterResponse(requestParams, response, context, ee, next) {
  const responseTime = Date.now() - context.vars.requestStartTime;
  
  // Track slow requests (>2 seconds)
  if (responseTime > 2000) {
    customMetrics.slowRequests++;
    ee.emit('counter', 'custom.slow_requests', 1);
  }
  
  // Track error responses
  if (response.statusCode >= 400) {
    customMetrics.errorRequests++;
    ee.emit('counter', 'custom.error_requests', 1);
  }
  
  // Emit custom metrics
  ee.emit('counter', 'custom.total_requests', 1);
  ee.emit('histogram', 'custom.response_time', responseTime);
  
  // Log interesting responses for debugging
  if (response.statusCode >= 500) {
    console.log(`Server error: ${response.statusCode} for ${requestParams.url}`);
  }
  
  return next();
}

function beforeScenario(context, ee, next) {
  // Set up scenario-specific context
  context.vars.scenarioStartTime = Date.now();
  return next();
}

function afterScenario(context, ee, next) {
  const scenarioDuration = Date.now() - context.vars.scenarioStartTime;
  ee.emit('histogram', 'custom.scenario_duration', scenarioDuration);
  
  return next();
}

// Report custom metrics at the end
process.on('SIGINT', () => {
  console.log('\n--- Custom Load Test Metrics ---');
  console.log(`Total Requests: ${customMetrics.totalRequests}`);
  console.log(`Error Requests: ${customMetrics.errorRequests} (${(customMetrics.errorRequests / customMetrics.totalRequests * 100).toFixed(2)}%)`);
  console.log(`Slow Requests (>2s): ${customMetrics.slowRequests} (${(customMetrics.slowRequests / customMetrics.totalRequests * 100).toFixed(2)}%)`);
  console.log(`Search Requests: ${customMetrics.searchRequests}`);
  console.log(`Homepage Views: ${customMetrics.homePageViews}`);
  console.log('--- End Custom Metrics ---\n');
});