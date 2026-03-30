import * as fs from 'fs';

const sources = JSON.parse(fs.readFileSync('final_verified_sources.json', 'utf8'));

const feedSources = sources.map(s => {
  let sphere = 'Provincial';
  let category = 'News';
  let location = 'Eastern Cape';

  if (s.category === 'National') {
    sphere = 'National';
    category = 'News';
    location = 'South Africa';
  } else if (s.category === 'Local') {
    sphere = 'Local';
    category = 'Local';
    // Try to extract location from name or ec_relevance
    if (s.name.includes('Pondoland')) location = 'Pondoland';
    else if (s.name.includes('PE')) location = 'Port Elizabeth';
    else if (s.name.includes('Kouga')) location = 'Kouga';
    else if (s.name.includes('Jeffreys Bay')) location = 'Jeffreys Bay';
    else if (s.name.includes('Graaff-Reinet')) location = 'Graaff-Reinet';
    else if (s.name.includes('Grocott')) location = 'Makhanda';
  } else if (s.category === 'Regional') {
    sphere = 'Provincial';
    category = 'News';
    location = 'Eastern Cape';
  } else if (s.category === 'Official') {
    category = 'Government';
    if (s.name.includes('SA Government') || s.name.includes('GCIS') || s.name.includes('Parliament')) {
      sphere = 'National';
      location = 'South Africa';
    } else if (s.name.includes('EC Department')) {
      sphere = 'Provincial';
      location = 'Eastern Cape';
    } else {
      sphere = 'Local';
      location = s.name.replace(' Municipality News', '').replace(' District News', '').replace(' Metro', '');
    }
  }

  const result = {
    name: s.name,
    url: s.url,
    category: category,
    sphere: sphere,
    location: location,
    type: s.url.includes('feed') || s.url.includes('rss') ? 'rss' : 'scrape'
  };

  return result;
});

console.log(JSON.stringify(feedSources, null, 2));
