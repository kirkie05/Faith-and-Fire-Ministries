const fetch = require('node-fetch');

async function test() {
  const urls = [
    'https://www.youtube.com/@ClickChurch',
    'https://www.youtube.com/channel/UC4kimR0MvBFVEro4RryplOQ',
    'https://www.youtube.com/user/elevationchurch'
  ];

  for (const u of urls) {
    try {
      console.log('Testing', u);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(u)}`);
      const data = await res.json();
      console.log('Result for', u, ':', data.status, data.items ? data.items.length + ' items' : 'no items');
      if (data.status !== 'ok') console.log('Error message:', data.message);
    } catch (e) {
      console.error(e);
    }
  }
}

test();
