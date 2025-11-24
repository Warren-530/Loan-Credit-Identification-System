const formData = new FormData();
// We need to mock File object or use a library, but for simple test we can try to just hit the endpoint if we can construct a request.
// Since we are in node, we need 'form-data' package or similar, or just use fetch with boundary.
// But we don't have 'form-data' installed likely.

// Let's try a simple GET to /api/applications to check connectivity and JSON parsing.
async function testApi() {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/applications`);
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
    const json = JSON.parse(text);
    console.log('JSON parsed successfully');
  } catch (e) {
    console.error('Error:', e);
  }
}

testApi();
