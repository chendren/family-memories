#!/usr/bin/env node
/**
 * Seed script — creates a realistic 4-generation Sullivan-Martinelli family tree
 * with 50+ members and 40+ memories across text, photo, audio, and video types.
 *
 * Usage: node scripts/seed.mjs
 * Requires: server running on localhost:3142
 */

const BASE = 'http://localhost:3142';
const ids = {};
let memoryCount = 0;
let memberCount = 0;
let relCount = 0;
let requestCount = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  // Pace requests to avoid 200/min rate limit
  requestCount++;
  if (requestCount % 150 === 0) {
    console.log('  (pausing 61s for rate limit window reset...)');
    await sleep(61000);
  }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  FAIL ${path}: ${res.status} ${text.slice(0, 200)}`);
    return null;
  }
  return res.json();
}

async function createMember(key, data) {
  const result = await post('/api/family/members', data);
  if (!result) return null;
  ids[key] = result.data.id;
  memberCount++;
  return ids[key];
}

async function relate(fromKey, toKey, type, notes) {
  const r = await post('/api/family/relationships', {
    from_member_id: ids[fromKey],
    to_member_id: ids[toKey],
    relationship_type: type,
    notes: notes ?? undefined,
  });
  if (r) relCount++;
}

async function mem(data) {
  const { personKeys, tags, ...rest } = data;
  const person_ids = personKeys?.map(k => ids[k]).filter(Boolean) ?? [];
  const r = await post('/api/memories', { ...rest, person_ids, tag_names: tags ?? [] });
  if (r) memoryCount++;
}

// ─────────────────────────────────────────────────────────────────────
// GENERATION 0 — Great-Great Grandparents (born ~1895-1900)
// ─────────────────────────────────────────────────────────────────────

async function seedGen0() {
  console.log('\n═══ Generation 0: Great-Great Grandparents ═══');

  await createMember('harold', {
    name: 'Harold James Sullivan',
    nickname: 'Harry',
    birth_date: '1898-03-14',
    death_date: '1972-11-08',
    bio: 'Irish-American shipyard foreman in Boston. Emigrated from County Cork at age 12. Known for his booming laugh, love of baseball, and the way he could fix anything with wire and determination. Served in WWI.',
    gender: 'male',
  });

  await createMember('margaret', {
    name: 'Margaret Rose O\'Connell',
    nickname: 'Maggie',
    birth_date: '1900-06-22',
    death_date: '1978-02-14',
    bio: 'Born in Quincy, Massachusetts. Raised seven siblings after her mother passed. Famous for her Irish soda bread, her rose garden, and her insistence that every guest leave with a full stomach. Married Harold in 1919.',
    gender: 'female',
  });

  await createMember('giuseppe', {
    name: 'Giuseppe Martinelli',
    nickname: 'Joseph',
    birth_date: '1895-08-03',
    death_date: '1968-05-19',
    bio: 'Master stonemason who immigrated from Agrigento, Sicily in 1912. Built half the church steps in Brooklyn with his own hands. Played bocce every Sunday in Prospect Park until the day he couldn\'t walk there anymore.',
    gender: 'male',
  });

  await createMember('rosa', {
    name: 'Rosa Calogera Ferraro',
    nickname: 'Nonna Rosa',
    birth_date: '1897-12-01',
    death_date: '1975-09-30',
    bio: 'Born in Brooklyn to Sicilian parents. Ran a tailoring shop on Atlantic Avenue for forty years. Could look at a person once and know their measurements. Her Sunday gravy recipe fed three generations.',
    gender: 'female',
  });

  await relate('harold', 'margaret', 'spouse', 'Married June 1919 at St. Patrick\'s Church, Boston');
  await relate('giuseppe', 'rosa', 'spouse', 'Married September 1918 at Our Lady of Peace, Brooklyn');
}

// ─────────────────────────────────────────────────────────────────────
// GENERATION 1 — Great Grandparents (born ~1920-1935)
// Sullivan children: 4 (2M, 2F)
// Martinelli children: 6 (3M, 3F)
// ─────────────────────────────────────────────────────────────────────

async function seedGen1() {
  console.log('\n═══ Generation 1: Great Grandparents ═══');

  // Sullivan children
  await createMember('robert', {
    name: 'Robert Harold Sullivan',
    nickname: 'Bobby',
    birth_date: '1922-01-17',
    death_date: '1998-08-03',
    bio: 'Oldest Sullivan child. Electrician by trade, storyteller by nature. Met Elena Martinelli at a dance hall in 1944 and said he knew immediately. Served in the Navy during WWII in the Pacific theater.',
    gender: 'male',
  });

  await createMember('dorothy', {
    name: 'Dorothy Mae Sullivan',
    nickname: 'Dot',
    birth_date: '1924-09-05',
    death_date: '2010-12-22',
    bio: 'Second Sullivan child. Schoolteacher for 35 years at Lincoln Elementary. Could quiet a room of thirty children with one look. Loved crossword puzzles and kept every letter anyone ever sent her.',
    gender: 'female',
  });

  await createMember('thomas_s', {
    name: 'Thomas Patrick Sullivan',
    nickname: 'Tommy',
    birth_date: '1927-04-12',
    death_date: '2005-07-19',
    bio: 'Third Sullivan child. Became a firefighter like his uncle. Captain of Ladder 14 for twenty years. The kind of man who ran into burning buildings and came home to build birdhouses in the garage.',
    gender: 'male',
  });

  await createMember('mary_s', {
    name: 'Mary Catherine Sullivan',
    nickname: 'Katie',
    birth_date: '1930-11-28',
    death_date: '2018-03-15',
    bio: 'Youngest Sullivan. Registered nurse at Massachusetts General for forty years. Never married until she was 38 — said she was too busy saving lives. Married George Henderson in 1968.',
    gender: 'female',
  });

  // Martinelli children
  await createMember('elena', {
    name: 'Elena Maria Martinelli',
    nickname: 'Lena',
    birth_date: '1920-05-10',
    death_date: '2002-01-04',
    bio: 'Eldest Martinelli child. Inherited her mother\'s gift for sewing and her father\'s stubbornness. Married Robert Sullivan in 1945 after he came home from the war. Their love story is legendary in the family.',
    gender: 'female',
  });

  await createMember('tony', {
    name: 'Antonio Giuseppe Martinelli',
    nickname: 'Tony',
    birth_date: '1922-07-30',
    death_date: '1995-04-11',
    bio: 'Second Martinelli child. Ran a bakery on Court Street that smelled like heaven. Woke up at 3am every day for forty years. His cannoli were the best in Brooklyn — people drove from Manhattan for them.',
    gender: 'male',
  });

  await createMember('lucia', {
    name: 'Lucia Anna Martinelli',
    nickname: 'Lucy',
    birth_date: '1925-02-18',
    death_date: '2012-06-05',
    bio: 'Third Martinelli child. Opera singer who almost made it to the Met. Sang at every family wedding, baptism, and funeral. Her voice could make grown men cry — and often did.',
    gender: 'female',
  });

  await createMember('marco', {
    name: 'Marco Salvatore Martinelli',
    nickname: 'Marc',
    birth_date: '1928-10-09',
    death_date: '2009-11-14',
    bio: 'Fourth Martinelli child. High school math teacher and baseball coach. Led the Jefferson Hawks to three city championships. Still the all-time winningest coach in the school\'s history.',
    gender: 'male',
  });

  await createMember('sofia', {
    name: 'Sofia Rosa Martinelli',
    nickname: 'Sophie',
    birth_date: '1931-03-25',
    bio: 'Fifth Martinelli child. Still living at 95. Married William Chen in 1955 — a scandalous mixed marriage at the time that eventually brought two cultures together beautifully. Retired librarian.',
    gender: 'female',
  });

  await createMember('dominic', {
    name: 'Dominic Paul Martinelli',
    nickname: 'Dom',
    birth_date: '1934-08-16',
    death_date: '2020-04-12',
    bio: 'Youngest Martinelli, the baby of the family. Became an accountant — the first Martinelli to work behind a desk. Gentle soul who kept the family finances organized and hosted every Thanksgiving.',
    gender: 'male',
  });

  // In-law spouses
  await createMember('james_w', {
    name: 'James Arthur Wright',
    nickname: 'Jim',
    birth_date: '1923-06-14',
    death_date: '2001-09-08',
    bio: 'Dorothy\'s husband. Quiet carpenter who built their house from scratch. His woodwork was as precise as Dorothy\'s grammar. They balanced each other perfectly for 55 years.',
    gender: 'male',
  });

  await createMember('helen_b', {
    name: 'Helen Louise Baker',
    birth_date: '1929-12-03',
    death_date: '2015-08-22',
    bio: 'Thomas\'s wife. Daughter of a dairy farmer from Vermont. Brought a love of the outdoors to the Sullivan family. Organized every family camping trip for three decades.',
    gender: 'female',
  });

  await createMember('george_h', {
    name: 'George William Henderson',
    birth_date: '1928-07-07',
    death_date: '2016-01-30',
    bio: 'Mary\'s husband. Doctor who ran a family practice for forty years. Met Mary when she was his head nurse. Patients said he never rushed an appointment in his life.',
    gender: 'male',
  });

  await createMember('catherine_o', {
    name: 'Catherine Ann O\'Brien',
    nickname: 'Cathy',
    birth_date: '1924-04-19',
    death_date: '1999-12-28',
    bio: 'Tony\'s wife. Irish-American from Flatbush. The Italian-Irish combination produced some of the best cooking arguments Brooklyn has ever seen — and the most delicious compromises.',
    gender: 'female',
  });

  await createMember('frank_d', {
    name: 'Frank Joseph Davis',
    nickname: 'Big Frank',
    birth_date: '1923-11-22',
    death_date: '2008-03-17',
    bio: 'Lucia\'s husband. Jazz musician who played saxophone in clubs all over the city. Met Lucia at a club where she was singing — said he lost the melody when he saw her face.',
    gender: 'male',
  });

  await createMember('betty_j', {
    name: 'Betty Lou Johnson',
    birth_date: '1930-08-11',
    death_date: '2014-05-02',
    bio: 'Marco\'s wife. High school sweetheart who sat behind him in chemistry class. Became a real estate agent and sold more houses than anyone in the county.',
    gender: 'female',
  });

  await createMember('william_c', {
    name: 'William David Chen',
    nickname: 'Bill',
    birth_date: '1929-01-28',
    death_date: '2019-10-15',
    bio: 'Sofia\'s husband. Chinese-American engineer whose parents ran a laundry in Chinatown. Designed bridges for the city for thirty years. Their wedding combined Italian food and Chinese tea ceremony.',
    gender: 'male',
  });

  await createMember('peggy_m', {
    name: 'Peggy Ann Miller',
    birth_date: '1936-05-30',
    bio: 'Dominic\'s wife. Former secretary who became the family genealogist. Has binders full of every document, photo, and letter the family ever produced. Living in assisted living in Florida.',
    gender: 'female',
  });

  // Parent-child relationships (Gen 0 → Gen 1)
  for (const child of ['robert', 'dorothy', 'thomas_s', 'mary_s']) {
    await relate('harold', child, 'parent');
    await relate('margaret', child, 'parent');
  }
  for (const child of ['elena', 'tony', 'lucia', 'marco', 'sofia', 'dominic']) {
    await relate('giuseppe', child, 'parent');
    await relate('rosa', child, 'parent');
  }

  // Sibling relationships
  const sullivanKids = ['robert', 'dorothy', 'thomas_s', 'mary_s'];
  for (let i = 0; i < sullivanKids.length; i++) {
    for (let j = i + 1; j < sullivanKids.length; j++) {
      await relate(sullivanKids[i], sullivanKids[j], 'sibling');
    }
  }
  const martinelliKids = ['elena', 'tony', 'lucia', 'marco', 'sofia', 'dominic'];
  for (let i = 0; i < martinelliKids.length; i++) {
    for (let j = i + 1; j < martinelliKids.length; j++) {
      await relate(martinelliKids[i], martinelliKids[j], 'sibling');
    }
  }

  // Spouse relationships (Gen 1)
  await relate('robert', 'elena', 'spouse', 'Married October 1945, St. Mary\'s Church');
  await relate('dorothy', 'james_w', 'spouse', 'Married June 1948');
  await relate('thomas_s', 'helen_b', 'spouse', 'Married April 1951');
  await relate('mary_s', 'george_h', 'spouse', 'Married September 1968');
  await relate('tony', 'catherine_o', 'spouse', 'Married March 1946');
  await relate('lucia', 'frank_d', 'spouse', 'Married December 1947');
  await relate('marco', 'betty_j', 'spouse', 'Married June 1952');
  await relate('sofia', 'william_c', 'spouse', 'Married August 1955');
  await relate('dominic', 'peggy_m', 'spouse', 'Married May 1958');
}

// ─────────────────────────────────────────────────────────────────────
// GENERATION 2 — Grandparents (born ~1948-1965)
// ─────────────────────────────────────────────────────────────────────

async function seedGen2() {
  console.log('\n═══ Generation 2: Grandparents ═══');

  // Robert & Elena Sullivan's children (3)
  await createMember('michael_s', {
    name: 'Michael Robert Sullivan',
    nickname: 'Mike',
    birth_date: '1948-03-22',
    bio: 'Eldest son of Robert and Elena. Vietnam veteran who came home and became a social worker. Quiet strength. Married Sarah Thompson in 1974.',
    gender: 'male',
  });
  await createMember('patricia_s', {
    name: 'Patricia Elena Sullivan',
    nickname: 'Patty',
    birth_date: '1951-07-09',
    bio: 'Middle child of Robert and Elena. Inherited her grandmother Rosa\'s talent for sewing. Fashion designer who had a small boutique in the Village for twenty years.',
    gender: 'female',
  });
  await createMember('lisa_s', {
    name: 'Lisa Marie Sullivan',
    birth_date: '1955-11-30',
    bio: 'Youngest child of Robert and Elena. Elementary school art teacher. Paints watercolors of every place the family has ever lived. Her kitchen is covered in children\'s artwork.',
    gender: 'female',
  });

  // Dorothy & James Wright's children (2)
  await createMember('susan_w', {
    name: 'Susan Dorothy Wright',
    birth_date: '1950-04-16',
    bio: 'Dorothy and Jim\'s eldest. Lawyer who fought housing discrimination cases. Sharp as a tack like her mother. Married Tom Anderson.',
    gender: 'female',
  });
  await createMember('david_w', {
    name: 'David James Wright',
    birth_date: '1953-12-01',
    bio: 'Dorothy and Jim\'s son. Inherited his father\'s love of woodworking and his mother\'s love of words. Became a journalist. Never married — says the newsroom is his spouse.',
    gender: 'male',
  });

  // Thomas & Helen Sullivan's children (3)
  await createMember('john_s', {
    name: 'John Thomas Sullivan',
    nickname: 'Johnny',
    birth_date: '1952-08-18',
    bio: 'Thomas and Helen\'s eldest. Third-generation firefighter. Battalion chief. His kids say he can\'t pass a fire station without stopping to say hello.',
    gender: 'male',
  });
  await createMember('karen_s', {
    name: 'Karen Ann Sullivan',
    birth_date: '1954-05-23',
    bio: 'Thomas and Helen\'s middle child. Pediatrician who runs a practice in the old neighborhood. Still makes house calls for elderly patients. Married Richard Torres.',
    gender: 'female',
  });
  await createMember('steven_s', {
    name: 'Steven Patrick Sullivan',
    nickname: 'Steve',
    birth_date: '1958-02-14',
    bio: 'Thomas and Helen\'s youngest. Born on Valentine\'s Day. Became a high school history teacher and football coach. His halftime speeches are the stuff of legend.',
    gender: 'male',
  });

  // Mary & George Henderson's children (2)
  await createMember('nancy_h', {
    name: 'Nancy Jane Henderson',
    birth_date: '1969-06-15',
    bio: 'Mary and George\'s daughter. Born when Mary was 38. Pharmacist who runs the local drugstore. Knows every customer by name and their medications by heart.',
    gender: 'female',
  });
  await createMember('william_h', {
    name: 'William George Henderson',
    nickname: 'Will',
    birth_date: '1971-09-30',
    bio: 'Mary and George\'s son. Followed his father into medicine — orthopedic surgeon. The family\'s go-to for every sprain, break, and "does this look weird to you?" question.',
    gender: 'male',
  });

  // Tony & Catherine Martinelli's children (2)
  await createMember('paul_m', {
    name: 'Paul Anthony Martinelli',
    birth_date: '1950-01-08',
    bio: 'Tony and Catherine\'s eldest. Took over the bakery from his father. Still uses Nonna Rosa\'s original cannoli recipe. His daughter says he smells permanently like vanilla.',
    gender: 'male',
  });
  await createMember('maria_m', {
    name: 'Maria Catherine Martinelli',
    birth_date: '1953-10-22',
    bio: 'Tony and Catherine\'s daughter. Became a nun at 22, left at 35, became a social activist. Runs a food bank that feeds 500 families a week.',
    gender: 'female',
  });

  // Lucia & Frank Davis's children (4)
  await createMember('frank_jr', {
    name: 'Frank Joseph Davis Jr.',
    nickname: 'Frankie',
    birth_date: '1949-09-01',
    bio: 'Lucia and Big Frank\'s eldest. Inherited his father\'s musical talent — plays jazz piano at clubs on weekends. Day job: high school music teacher.',
    gender: 'male',
  });
  await createMember('jennifer_d', {
    name: 'Jennifer Lucia Davis',
    nickname: 'Jenny',
    birth_date: '1952-03-14',
    bio: 'Lucia and Big Frank\'s daughter. Has her mother\'s voice. Broadway chorus for fifteen years before becoming a vocal coach. Every family karaoke night, she\'s the star.',
    gender: 'female',
  });
  await createMember('daniel_d', {
    name: 'Daniel Francis Davis',
    nickname: 'Danny',
    birth_date: '1955-07-07',
    bio: 'Lucia and Big Frank\'s third child. Saxophone player like his father. Toured with jazz bands in his twenties, then settled down as a music producer.',
    gender: 'male',
  });
  await createMember('amy_d', {
    name: 'Amy Rose Davis',
    birth_date: '1958-12-25',
    bio: 'Lucia and Big Frank\'s youngest. Born on Christmas Day. Dancer who performed with Alvin Ailey. Now runs a dance studio and choreographs community theater.',
    gender: 'female',
  });

  // Marco & Betty Martinelli's children (2)
  await createMember('mark_m', {
    name: 'Mark Marco Martinelli',
    birth_date: '1954-06-11',
    bio: 'Marco and Betty\'s son. Real estate developer who built affordable housing in the old neighborhood. Says his mother taught him that homes aren\'t just investments.',
    gender: 'male',
  });
  await createMember('christina_m', {
    name: 'Christina Anne Martinelli',
    nickname: 'Chrissy',
    birth_date: '1957-02-28',
    bio: 'Marco and Betty\'s daughter. CPA who does taxes for half the family for free. Organized and meticulous — the one everyone calls when they need a spreadsheet.',
    gender: 'female',
  });

  // Sofia & William Chen's children (3)
  await createMember('grace_c', {
    name: 'Grace Mei-Lin Chen',
    birth_date: '1956-04-05',
    bio: 'Sofia and Bill\'s eldest. Named after Bill\'s mother. Architect who designs community spaces. Her buildings feel like they\'re giving you a hug.',
    gender: 'female',
  });
  await createMember('henry_c', {
    name: 'Henry Wei Chen',
    birth_date: '1959-08-19',
    bio: 'Sofia and Bill\'s son. Software engineer who worked at Bell Labs. Quiet and brilliant like his father. Makes the best dumplings in the family — learned from his paternal grandmother.',
    gender: 'male',
  });
  await createMember('lily_c', {
    name: 'Lily Rosa Chen',
    birth_date: '1962-01-12',
    bio: 'Sofia and Bill\'s youngest. Named after Nonna Rosa. Pediatric oncologist. The toughest and kindest person in the family. Her patients\' parents write her thank-you letters years later.',
    gender: 'female',
  });

  // Dominic & Peggy Martinelli's children (1)
  await createMember('dom_jr', {
    name: 'Dominic Paul Martinelli Jr.',
    nickname: 'DJ',
    birth_date: '1960-10-03',
    bio: 'Only child of Dominic and Peggy. Insurance agent who inherited his father\'s gentle nature and his mother\'s obsession with record-keeping. The family historian.',
    gender: 'male',
  });

  // Gen 2 spouses (selected)
  await createMember('sarah_t', {
    name: 'Sarah Elizabeth Thompson',
    birth_date: '1950-09-12',
    bio: 'Michael\'s wife. Nurse who met Mike at the VA hospital where he was being treated. Their first date was in the hospital cafeteria. They\'ve been inseparable since.',
    gender: 'female',
  });
  await createMember('tom_a', {
    name: 'Thomas James Anderson',
    nickname: 'Tom',
    birth_date: '1949-11-27',
    bio: 'Susan\'s husband. Civil rights attorney. He and Susan are the power couple who argue cases during the day and argue about whose turn it is to cook at night.',
    gender: 'male',
  });
  await createMember('richard_t', {
    name: 'Richard Manuel Torres',
    nickname: 'Rich',
    birth_date: '1952-03-30',
    bio: 'Karen\'s husband. Emergency room physician. He and Karen met during their residencies and never looked back. Their dinner conversations are not for the faint of heart.',
    gender: 'male',
  });
  await createMember('linda_g', {
    name: 'Linda Maria Garcia',
    birth_date: '1953-07-17',
    bio: 'Paul\'s wife. Mexican-American chef who married into an Italian bakery family. The fusion experiments at holiday dinners are legendary — cannoli with dulce de leche was her masterpiece.',
    gender: 'female',
  });
  await createMember('kevin_o', {
    name: 'Kevin Patrick O\'Brien',
    birth_date: '1955-02-14',
    bio: 'Grace\'s husband. Firefighter turned fire marshal. Irish-American. When he married Grace, it added a third culture to the Sullivan-Martinelli-Chen mix.',
    gender: 'male',
  });
  await createMember('carol_n', {
    name: 'Carol Jean Nelson',
    birth_date: '1951-06-08',
    bio: 'Frankie\'s wife. High school English teacher who corrects everyone\'s grammar at family gatherings. She and Frankie have "music vs. literature" debates that last until dessert.',
    gender: 'female',
  });

  // Parent-child relationships (Gen 1 → Gen 2)
  for (const child of ['michael_s', 'patricia_s', 'lisa_s']) {
    await relate('robert', child, 'parent');
    await relate('elena', child, 'parent');
  }
  for (const child of ['susan_w', 'david_w']) {
    await relate('dorothy', child, 'parent');
    await relate('james_w', child, 'parent');
  }
  for (const child of ['john_s', 'karen_s', 'steven_s']) {
    await relate('thomas_s', child, 'parent');
    await relate('helen_b', child, 'parent');
  }
  for (const child of ['nancy_h', 'william_h']) {
    await relate('mary_s', child, 'parent');
    await relate('george_h', child, 'parent');
  }
  for (const child of ['paul_m', 'maria_m']) {
    await relate('tony', child, 'parent');
    await relate('catherine_o', child, 'parent');
  }
  for (const child of ['frank_jr', 'jennifer_d', 'daniel_d', 'amy_d']) {
    await relate('lucia', child, 'parent');
    await relate('frank_d', child, 'parent');
  }
  for (const child of ['mark_m', 'christina_m']) {
    await relate('marco', child, 'parent');
    await relate('betty_j', child, 'parent');
  }
  for (const child of ['grace_c', 'henry_c', 'lily_c']) {
    await relate('sofia', child, 'parent');
    await relate('william_c', child, 'parent');
  }
  await relate('dominic', 'dom_jr', 'parent');
  await relate('peggy_m', 'dom_jr', 'parent');

  // Gen 2 spouse relationships
  await relate('michael_s', 'sarah_t', 'spouse');
  await relate('susan_w', 'tom_a', 'spouse');
  await relate('karen_s', 'richard_t', 'spouse');
  await relate('paul_m', 'linda_g', 'spouse');
  await relate('grace_c', 'kevin_o', 'spouse');
  await relate('frank_jr', 'carol_n', 'spouse');
}

// ─────────────────────────────────────────────────────────────────────
// GENERATION 3 — Parents / Young adults (born ~1975-1995)
// ─────────────────────────────────────────────────────────────────────

async function seedGen3() {
  console.log('\n═══ Generation 3: Parents / Young Adults ═══');

  // Michael & Sarah Sullivan's kids (2)
  await createMember('ryan_s', {
    name: 'Ryan Michael Sullivan',
    birth_date: '1978-05-14',
    bio: 'Michael and Sarah\'s son. Software developer who builds apps. Named after his grandfather Robert. The tech-savvy one who set up this family memories system.',
    gender: 'male',
  });
  await createMember('emily_s', {
    name: 'Emily Rose Sullivan',
    birth_date: '1981-11-02',
    bio: 'Michael and Sarah\'s daughter. Kindergarten teacher like Great-Aunt Dorothy. Says she inherited the "Sullivan teacher gene." Married Jake Davis — connecting the Sullivan and Davis branches.',
    gender: 'female',
  });

  // Susan & Tom Anderson's kids (3)
  await createMember('jason_a', {
    name: 'Jason Thomas Anderson',
    birth_date: '1976-08-21',
    bio: 'Susan and Tom\'s eldest. Public defender. Carries on the family tradition of fighting for justice. His closing arguments make juries cry.',
    gender: 'male',
  });
  await createMember('katie_a', {
    name: 'Katie Susan Anderson',
    birth_date: '1979-03-10',
    bio: 'Susan and Tom\'s middle child. Journalist covering immigration stories. Won a Peabody. Says Great-Grandpa Giuseppe\'s story is why she does what she does.',
    gender: 'female',
  });
  await createMember('brian_a', {
    name: 'Brian David Anderson',
    birth_date: '1982-06-30',
    bio: 'Susan and Tom\'s youngest. Chef who opened a restaurant that fuses Italian-Irish-Chinese cuisines. Menu changes based on which grandmother\'s recipe book he opens that week.',
    gender: 'male',
  });

  // Paul & Linda Martinelli's kids (2)
  await createMember('anthony_m', {
    name: 'Anthony Paul Martinelli',
    nickname: 'AJ',
    birth_date: '1980-02-28',
    bio: 'Paul and Linda\'s son. Fourth-generation baker. Added Mexican pastries to the Martinelli bakery menu — conchas and cannoli side by side. Business has never been better.',
    gender: 'male',
  });
  await createMember('sofia_m', {
    name: 'Sofia Linda Martinelli',
    birth_date: '1983-09-15',
    bio: 'Paul and Linda\'s daughter. Named after Great-Aunt Sofia. Immigration lawyer. Fluent in English, Italian, and Spanish. Says the family immigration stories radicalized her.',
    gender: 'female',
  });

  // Grace & Kevin O'Brien's kids (2)
  await createMember('mia_o', {
    name: 'Mia Grace O\'Brien',
    birth_date: '1985-04-22',
    bio: 'Grace and Kevin\'s daughter. Architect like her mother. Specializes in sustainable design. Her thesis was about redesigning the block where Nonna Rosa\'s shop used to be.',
    gender: 'female',
  });
  await createMember('ethan_o', {
    name: 'Ethan James O\'Brien',
    birth_date: '1988-12-07',
    bio: 'Grace and Kevin\'s son. Musician who plays traditional Chinese instruments fused with jazz — honoring both sides of his heritage. Performs at festivals worldwide.',
    gender: 'male',
  });

  // Frankie & Carol Davis's kids (1)
  await createMember('jake_d', {
    name: 'Jake Francis Davis',
    birth_date: '1979-07-04',
    bio: 'Frankie and Carol\'s son. Born on the Fourth of July. Music producer who married Emily Sullivan — connecting the Sullivan and Davis branches of the family. Their kids are double-family.',
    gender: 'male',
  });

  // Karen & Richard Torres's kids (2)
  await createMember('isabella_t', {
    name: 'Isabella Rose Torres',
    nickname: 'Bella',
    birth_date: '1982-01-19',
    bio: 'Karen and Rich\'s daughter. Emergency physician — third generation of doctors in the family. Works at the same hospital where Great-Aunt Mary used to be a nurse.',
    gender: 'female',
  });
  await createMember('lucas_t', {
    name: 'Lucas Patrick Torres',
    birth_date: '1985-10-31',
    bio: 'Karen and Rich\'s son. Born on Halloween. Firefighter — carrying on Great-Grandpa Thomas\'s legacy. Fourth-generation Sullivan firefighter, but with a Torres name.',
    gender: 'male',
  });

  // Parent-child relationships (Gen 2 → Gen 3)
  for (const child of ['ryan_s', 'emily_s']) {
    await relate('michael_s', child, 'parent');
    await relate('sarah_t', child, 'parent');
  }
  for (const child of ['jason_a', 'katie_a', 'brian_a']) {
    await relate('susan_w', child, 'parent');
    await relate('tom_a', child, 'parent');
  }
  for (const child of ['anthony_m', 'sofia_m']) {
    await relate('paul_m', child, 'parent');
    await relate('linda_g', child, 'parent');
  }
  for (const child of ['mia_o', 'ethan_o']) {
    await relate('grace_c', child, 'parent');
    await relate('kevin_o', child, 'parent');
  }
  await relate('frank_jr', 'jake_d', 'parent');
  await relate('carol_n', 'jake_d', 'parent');
  for (const child of ['isabella_t', 'lucas_t']) {
    await relate('karen_s', child, 'parent');
    await relate('richard_t', child, 'parent');
  }

  // Cross-branch marriage
  await relate('emily_s', 'jake_d', 'spouse', 'Married 2008 — connecting the Sullivan and Davis branches');
}

// ─────────────────────────────────────────────────────────────────────
// MEMORIES — Rich content across all media types and decades
// ─────────────────────────────────────────────────────────────────────

async function seedMemories() {
  console.log('\n═══ Memories ═══');

  // --- 1920s-1940s: Immigration & Early Life ---
  await mem({
    title: 'Giuseppe\'s Arrival at Ellis Island',
    content: 'September 14, 1912. Giuseppe Martinelli, seventeen years old, stepped off the SS Duca d\'Aosta after eighteen days at sea. He carried a leather satchel with his stonemason\'s tools, a change of clothes, and a photograph of his mother that he would keep in his pocket until the day he died. He spoke no English. He had forty cents. An uncle he\'d never met was supposed to meet him at the Battery, but the uncle was two hours late. Giuseppe sat on his suitcase and watched America walk past him. He later said those two hours were the most frightened he\'d ever been — and the most free.',
    memory_type: 'text',
    memory_date: '1912-09-14',
    location: 'Ellis Island, New York',
    personKeys: ['giuseppe'],
    tags: ['immigration', 'origin story', 'family legend'],
  });

  await mem({
    title: 'The Sullivan Family Portrait, 1935',
    content: 'Black and white photograph taken on the front steps of 42 Maple Street, Boston. Harold stands in the back, one hand on Margaret\'s shoulder, wearing his Sunday suit — the only one he owned. Margaret sits in a wooden chair, holding baby Mary Catherine. Robert (13) stands ramrod straight in a too-big jacket. Dorothy (11) has her arm around Thomas (8), who is clearly mid-squirm. The house behind them still had the original clapboard siding that Harold painted every spring. This is the only photograph of all six Sullivans together before the boys went to war.',
    memory_type: 'photo',
    memory_date: '1935-06-15',
    location: '42 Maple Street, Boston, MA',
    personKeys: ['harold', 'margaret', 'robert', 'dorothy', 'thomas_s', 'mary_s'],
    tags: ['family portrait', '1930s', 'boston', 'childhood'],
  });

  await mem({
    title: 'Nonna Rosa\'s Sunday Gravy Recipe',
    content: 'Rosa\'s Sunday gravy was a religious experience. She started at 6am, searing pork ribs and braciole in olive oil until the kitchen smelled like heaven. San Marzano tomatoes — never anything else — crushed by hand because the food mill "takes the soul out." Garlic, never more than four cloves because "we\'re not animals." A bay leaf, a crust of Parmesan rind, and a pinch of sugar that she denied adding until the day she died. It simmered for six hours minimum. The meatballs went in during the last hour — a mixture of beef, pork, and veal, with stale bread soaked in milk, pecorino, and parsley. She fed fourteen people every Sunday from a single pot. When asked for the recipe, she\'d say "a little of this, a little of that" and refuse to measure anything. Elena finally learned it by standing next to her mother every Sunday for a year and writing down everything she saw.',
    memory_type: 'text',
    memory_date: '1955-03-12',
    location: 'Martinelli home, Brooklyn, NY',
    personKeys: ['rosa', 'elena'],
    tags: ['recipe', 'italian', 'sunday dinner', 'tradition', 'cooking'],
  });

  await mem({
    title: 'Robert\'s Letter Home from the Pacific, 1944',
    content: 'Dear Ma and Pop — I can\'t tell you where I am but I can tell you it\'s hot and the ocean is the most beautiful thing I\'ve ever seen, when it isn\'t trying to kill us. The food is terrible. I dream about Ma\'s pot roast every night. Tommy would love it here — he\'d probably try to swim to Japan. Tell Dot I got her letter and yes, I will try to bring her a seashell, though she should know I\'m not exactly on vacation. Tell Mary I miss her singing. I miss all of you more than I have words for. I met a girl before I shipped out — at a dance in Brooklyn. Elena Martinelli. Italian girl. I know what you\'re thinking, Pop, but wait till you meet her. She\'s something special. I\'m going to marry her when I get home. Don\'t tell her I said that. Your son, Bobby.',
    memory_type: 'text',
    memory_date: '1944-08-22',
    location: 'Pacific Theater, WWII',
    personKeys: ['robert', 'harold', 'margaret', 'dorothy', 'thomas_s', 'mary_s', 'elena'],
    tags: ['wwii', 'letter', 'love story', 'military'],
  });

  await mem({
    title: 'Bobby and Lena\'s Wedding Day',
    content: 'October 13, 1945. Robert Sullivan married Elena Martinelli at St. Mary\'s Church with both families filling every pew. It was the first time the Sullivans and Martinellis were in the same room. Harold wore a new tie — his only concession to the Italians. Giuseppe wore his best suit and cried during the vows. Margaret and Rosa sat on opposite sides of the aisle and sized each other up. By the reception, Rosa had taught Margaret how to make bruschetta, and Margaret had taught Rosa how to make Irish coffee. They were inseparable for the next thirty years. The band played Glenn Miller and Sicilian folk songs. Robert and Elena\'s first dance was to "At Last" by Etta James. They danced to it every anniversary for fifty-three years.',
    memory_type: 'photo',
    memory_date: '1945-10-13',
    location: 'St. Mary\'s Church, Boston',
    personKeys: ['robert', 'elena', 'harold', 'margaret', 'giuseppe', 'rosa'],
    tags: ['wedding', 'love story', 'family union', '1940s'],
  });

  // --- 1950s-1960s: Building Lives ---

  await mem({
    title: 'Tony\'s Bakery Grand Opening',
    content: 'Tony Martinelli opened Martinelli\'s Bakery on Court Street in 1952 with $800 in savings and a prayer to Saint Honoratus, patron saint of bakers. Catherine painted the sign herself. Giuseppe laid the threshold stone — Sicilian tradition says a stonemason blesses the doorstep of his son\'s first business. Opening day, they gave away free cannoli and ran out by noon. Within a year, people were driving from Manhattan to buy Tony\'s sfogliatelle. By 1960, there was a line out the door every Saturday morning that didn\'t thin until the last loaf was sold. The bakery is still there, now run by Tony\'s grandson Anthony — who added Mexican conchas to the menu. Tony would have approved.',
    memory_type: 'photo',
    memory_date: '1952-04-15',
    location: 'Court Street, Brooklyn, NY',
    personKeys: ['tony', 'catherine_o', 'giuseppe'],
    tags: ['bakery', 'business', 'italian', 'brooklyn', 'tradition'],
  });

  await mem({
    title: 'Lucia Singing at Carnegie Hall',
    content: 'Recording of Lucia Martinelli-Davis performing "O Mio Babbino Caro" at a benefit concert at Carnegie Hall, 1958. She never made it to the Met, but this performance — captured on a reel-to-reel by her husband Frank — shows why she could have. Her voice fills the hall like liquid gold. At the end, you can hear Frank whisper "That\'s my girl" before the applause starts. This recording was nearly lost when their basement flooded in 1972, but Daniel salvaged the tape and had it digitized in 2005.',
    memory_type: 'audio',
    memory_date: '1958-11-22',
    location: 'Carnegie Hall, New York City',
    personKeys: ['lucia', 'frank_d', 'daniel_d'],
    tags: ['music', 'opera', 'performance', 'talent'],
  });

  await mem({
    title: 'Sofia and Bill\'s Wedding — Two Cultures, One Love',
    content: 'The wedding of Sofia Martinelli and William Chen in 1955 was unprecedented in both families. Giuseppe had never met a Chinese person. Bill\'s parents had never been to an Italian household. But Rosa and Bill\'s mother, Mei-Ling, bonded over food within the first hour — they spent the rehearsal dinner teaching each other dumpling techniques. The ceremony was Catholic, followed by a Chinese tea ceremony that made Giuseppe cry. The reception menu alternated: antipasto, then dim sum, then pasta, then Peking duck. Sofia wore a white dress for the church and changed into a red qipao for the tea ceremony. It was 1955. There were people who didn\'t approve. But as Margaret Sullivan said when someone complained: "Love is love, and if you don\'t like it, you can eat somewhere else."',
    memory_type: 'photo',
    memory_date: '1955-08-20',
    location: 'Our Lady of Peace Church, Brooklyn',
    personKeys: ['sofia', 'william_c', 'giuseppe', 'rosa', 'margaret'],
    tags: ['wedding', 'multicultural', 'love story', '1950s', 'courage'],
  });

  await mem({
    title: 'Dorothy\'s Retirement Speech',
    content: 'Audio recording of Dorothy Sullivan Wright\'s retirement speech after 35 years at Lincoln Elementary, 1984. Transcribed excerpt: "They asked me to give a speech, which is funny because I\'ve been talking to rooms full of people who don\'t want to listen for thirty-five years — I should be good at it by now. Every child who sat in my classroom taught me something. Bobby Fiorello taught me patience. Sarah McKinnon taught me that a child who reads under her desk during math is not misbehaving — she\'s gifted. Marcus Williams taught me that the quietest boy in the room sometimes has the loudest heart. I became a teacher because my mother told me that words are the most powerful tools in the world. She was right. I\'ve watched words open doors for children who thought every door was closed. I will miss this. But I won\'t miss the parking lot."',
    memory_type: 'audio',
    memory_date: '1984-06-14',
    location: 'Lincoln Elementary School, Boston',
    personKeys: ['dorothy', 'margaret'],
    tags: ['retirement', 'education', 'speech', 'career'],
  });

  await mem({
    title: 'The Great Sullivan-Martinelli Christmas of 1962',
    content: 'The first year both families celebrated Christmas together at Robert and Elena\'s house in Brookline. Forty-three people. One turkey, one ham, three trays of lasagna, Irish soda bread, cannoli, and a Chinese rice cake that Bill Chen\'s mother sent. Harold and Giuseppe played cards and argued about the Red Sox vs. the Dodgers. The children put on a nativity play where Baby Jesus was a Cabbage Patch doll and the Three Wise Men got lost because Thomas gave them wrong directions. Margaret and Rosa spent the evening in the kitchen, communicating in their own private language of gestures, shared recipes, and the occasional Italian or Gaelic word thrown in. By midnight, everyone was asleep in various rooms and hallways. It became an annual tradition that continued for forty years.',
    memory_type: 'text',
    memory_date: '1962-12-25',
    location: 'Sullivan home, Brookline, MA',
    personKeys: ['robert', 'elena', 'harold', 'margaret', 'giuseppe', 'rosa', 'thomas_s', 'dorothy', 'sofia', 'william_c'],
    tags: ['christmas', 'holiday', 'tradition', 'family gathering', 'food'],
  });

  await mem({
    title: 'Jim Wright Building the House, 1953',
    content: 'Video transferred from 8mm home movie film. Shows James Wright building the house at 15 Elm Street from the foundation up, over the course of a summer. Dorothy is visible in several shots, bringing him water and sandwiches while visibly pregnant with Susan. Jim built every wall, hung every door, laid every floor. The house took four months. When it was finished, he carried Dorothy over the threshold and the camera shook because Thomas Sullivan, who was filming, was laughing too hard. That house still stands. David Wright grew up in it and still owns it.',
    memory_type: 'video',
    memory_date: '1953-07-20',
    location: '15 Elm Street, Quincy, MA',
    personKeys: ['james_w', 'dorothy', 'thomas_s'],
    tags: ['house building', 'craftsmanship', '1950s', 'home'],
  });

  // --- 1970s-1980s: Next Generation ---

  await mem({
    title: 'Michael\'s Return from Vietnam',
    content: 'Michael Sullivan came home from Vietnam in 1971 and didn\'t speak for three weeks. His mother Elena would sit next to him on the porch and hold his hand without saying a word. His father Robert — who understood, because he\'d come home from his own war — would bring him coffee and sit across from him, also silent. It was Sarah Thompson, a nurse at the VA, who finally broke through. She didn\'t try to make him talk. She just told him about her day — every day for two months — until one day he told her about his. They were married within a year. Michael went on to spend thirty years as a social worker helping other veterans. He says Sarah saved his life. She says he saved his own — she just gave him someone to talk to.',
    memory_type: 'text',
    memory_date: '1971-09-15',
    location: 'Sullivan home, Brookline, MA',
    personKeys: ['michael_s', 'elena', 'robert', 'sarah_t'],
    tags: ['vietnam', 'military', 'love story', 'healing', 'veterans'],
  });

  await mem({
    title: 'Giuseppe\'s Bocce Tournament, Last Game',
    content: 'Photo of Giuseppe Martinelli at his last bocce game in Prospect Park, spring 1968. He\'s 72 years old, wearing a white shirt with the sleeves rolled up, his weathered hands around a bocce ball. The other players — mostly other Sicilian immigrants — are watching with that mix of competition and reverence. Giuseppe won that game. He died three weeks later, in his sleep, with Rosa beside him. At his funeral, his bocce partners placed a bocce ball in his casket. Rosa said he would have wanted his tools instead, but she\'d already given those to his grandson Paul for the bakery renovation.',
    memory_type: 'photo',
    memory_date: '1968-04-28',
    location: 'Prospect Park, Brooklyn, NY',
    personKeys: ['giuseppe', 'rosa'],
    tags: ['bocce', 'italian', 'last days', 'brooklyn', 'sports'],
  });

  await mem({
    title: 'The Sullivan Family Camping Trip Disaster of 1975',
    content: 'Helen Sullivan-Baker organized her annual camping trip to the White Mountains. In attendance: Thomas and Helen, all three kids (John 23, Karen 21, Steven 17), Robert and Elena with their three (Michael 27, Patricia 24, Lisa 20), and Dorothy with David (22). Twenty-four hours in, a black bear got into the food supply. Thomas tried to scare it off by banging pots together. The bear was unimpressed. John, the future firefighter, calmly suggested they give the bear the cooler and retreat. Steven, age 17, tried to film the bear with his new Super 8 camera and fell into the creek. Karen bandaged his scraped knee while Patricia made sandwiches from the only food the bear didn\'t take — peanut butter and crackers. They drove home early and stopped at a diner. Helen declared it the best camping trip ever, and no one had the heart to disagree.',
    memory_type: 'video',
    memory_date: '1975-08-10',
    location: 'White Mountains, New Hampshire',
    personKeys: ['helen_b', 'thomas_s', 'john_s', 'karen_s', 'steven_s', 'robert', 'elena', 'michael_s', 'patricia_s', 'lisa_s', 'dorothy', 'david_w'],
    tags: ['camping', 'adventure', 'funny', 'family trip', 'bear story'],
  });

  await mem({
    title: 'Margaret O\'Connell Sullivan\'s Irish Soda Bread',
    content: 'Margaret\'s soda bread was famous in three counties. She learned it from her mother, who learned it from hers, going back to County Kerry. The recipe itself is deceptively simple: four cups flour, one teaspoon salt, one teaspoon baking soda, buttermilk to bind. But Margaret\'s secret — which she told only to Dorothy and Elena — was to add a tablespoon of honey and a handful of caraway seeds, and to bake it in a cast iron pot that her grandmother brought from Ireland. The pot is now in Dorothy\'s kitchen. Dorothy\'s granddaughter Katie wrote a newspaper article about the bread and the pot. It was picked up by the Boston Globe. Margaret would have been mortified by the attention and secretly thrilled.',
    memory_type: 'text',
    memory_date: '1965-03-17',
    location: 'Sullivan home, Boston, MA',
    personKeys: ['margaret', 'dorothy', 'elena', 'katie_a'],
    tags: ['recipe', 'irish', 'baking', 'tradition', 'heirloom'],
  });

  await mem({
    title: 'Big Frank Davis at the Blue Note, 1961',
    content: 'Reel-to-reel audio recording of Frank "Big Frank" Davis playing tenor saxophone at the Blue Note jazz club with a pickup quartet. The set includes "Take Five," "My Funny Valentine," and a twelve-minute improvisation that made the bartender stop pouring drinks to listen. This was the night a Columbia Records scout was in the audience. He offered Frank a recording contract, but Frank turned it down — the tour schedule would have meant months away from Lucia and the kids. Frank said he never regretted it. Lucia said she would have told him to take it. Jennifer says she found the rejection letter in his saxophone case after he died, folded next to a photo of the family.',
    memory_type: 'audio',
    memory_date: '1961-09-15',
    location: 'Blue Note, New York City',
    personKeys: ['frank_d', 'lucia', 'jennifer_d'],
    tags: ['jazz', 'music', 'saxophone', 'performance', 'sacrifice'],
  });

  await mem({
    title: 'Grace Chen\'s Architecture Thesis: Redesigning Atlantic Avenue',
    content: 'Grace Mei-Lin Chen\'s Columbia architecture thesis proposed redesigning the block on Atlantic Avenue where her grandmother Rosa\'s tailoring shop once stood. The thesis was called "Stitching Memory Into Space" and argued that urban renewal doesn\'t have to mean erasure — that you can build new structures that honor the immigrant communities who shaped a neighborhood. She incorporated oral histories from her grandmother Sofia, her mother\'s memories of the shop, and interviews with surviving shopkeepers. The thesis won the department\'s highest honors. Twenty years later, Grace designed a community center on that same block. There\'s a plaque inside that reads: "For Rosa Ferraro Martinelli, who measured every customer with her eyes and every garment with her heart."',
    memory_type: 'text',
    memory_date: '1981-05-20',
    location: 'Columbia University, New York City',
    personKeys: ['grace_c', 'rosa', 'sofia'],
    tags: ['architecture', 'education', 'heritage', 'tribute'],
  });

  await mem({
    title: 'Thomas Sullivan\'s Last Alarm',
    content: 'Captain Thomas Patrick Sullivan\'s retirement ceremony from Ladder 14, 1987. Video shows the entire company lined up as Thomas walks out for the last time. They give him the traditional last alarm — the bell rings four sets of five, signifying a firefighter\'s final tour. His son John, already a lieutenant at another house, is in uniform in the front row, trying not to cry. Steven, in the back, is openly weeping. Helen holds Thomas\'s hand. Thomas\'s speech was four words: "Thank you. Stay safe." Then the alarm went off — a real one — and Thomas instinctively started for the truck before catching himself. The entire company laughed through their tears. John later said it was the proudest and saddest day of his life.',
    memory_type: 'video',
    memory_date: '1987-10-30',
    location: 'Ladder 14 Firehouse, Boston',
    personKeys: ['thomas_s', 'john_s', 'steven_s', 'helen_b'],
    tags: ['retirement', 'firefighter', 'ceremony', 'military tradition'],
  });

  // --- 1990s-2000s: Transitions ---

  await mem({
    title: 'Rosa\'s 75th Birthday — Four Generations',
    content: 'Photo from Nonna Rosa\'s 75th birthday party, 1972. She\'s seated at the head of a long table set up in the backyard on Atlantic Avenue. Giuseppe has been gone four years, and his chair is set but empty — Rosa insisted. Around her: all six of her children, their spouses, seventeen grandchildren, and the first great-grandchild (Jason Anderson, age 6 months, in Susan\'s arms). Rosa is cutting a cake that Tony made — a three-tiered sfogliatella-flavored masterpiece with "75" in sugared violets. Someone counted: there are 47 people in this photo. Rosa said she remembered when it was just her and Giuseppe in a one-room apartment, and she never imagined this. Three years later, she was gone. This photo hangs in every Martinelli household.',
    memory_type: 'photo',
    memory_date: '1972-12-01',
    location: 'Atlantic Avenue, Brooklyn, NY',
    personKeys: ['rosa', 'elena', 'tony', 'lucia', 'marco', 'sofia', 'dominic', 'susan_w', 'jason_a'],
    tags: ['birthday', 'milestone', 'four generations', 'family gathering'],
  });

  await mem({
    title: 'Harold Sullivan\'s Workshop',
    content: 'Photos of Harold Sullivan\'s basement workshop at 42 Maple Street, taken by Dorothy in 1970, two years before he passed. Every wall is covered with tools hung on pegboard — each outlined in marker so you could see what was missing. There\'s a workbench he built from a church pew that was being discarded. On the wall: photos of his children, his discharge papers from WWI, and a small American flag. Harold could fix anything. When the washing machine broke, he didn\'t call a repairman — he took it apart, figured it out, and put it back together. When Robert\'s car wouldn\'t start, Harold rebuilt the engine in a weekend. The workshop was his kingdom. After he died, Margaret left it exactly as it was for six years. She said she could still smell his pipe tobacco when she went down there.',
    memory_type: 'photo',
    memory_date: '1970-05-20',
    location: '42 Maple Street, Boston, MA',
    personKeys: ['harold', 'dorothy', 'margaret'],
    tags: ['workshop', 'tools', 'craftsmanship', 'tribute'],
  });

  await mem({
    title: 'Katie Anderson\'s Interview with Great-Aunt Sofia',
    content: 'Video interview recorded by Katie Anderson for her college journalism class, 1999. Sofia Chen (née Martinelli), age 68, sits in her living room surrounded by books. She talks about marrying Bill Chen in 1955: "People said terrible things. My father\'s friends said I was betraying the family. Bill\'s mother was worried I\'d never learn to cook Chinese food — that was her biggest concern, bless her. But Papa — my father Giuseppe — he said, \'Sofia, I came to this country because I believed people should be free to build the life they want. If this is the life you want, then build it.\' That was the bravest thing he ever said, because it cost him friends. And Mama Rosa? She just wanted to learn how to make dumplings." Katie got an A on the project. She later used this footage in her Peabody-winning documentary about immigrant families.',
    memory_type: 'video',
    memory_date: '1999-04-15',
    location: 'Chen home, Brooklyn, NY',
    personKeys: ['katie_a', 'sofia', 'william_c', 'giuseppe', 'rosa'],
    tags: ['interview', 'oral history', 'multicultural', 'courage', 'immigration'],
  });

  await mem({
    title: 'Robert Sullivan\'s Eulogy by Michael',
    content: 'My father was not a complicated man. He loved my mother. He loved his children. He loved this country — he fought for it, and then he came home and spent fifty years wiring houses so people could turn on the lights. He told terrible jokes. He\'d tell you the punchline first and then try to remember the setup. He sang off-key in the shower every morning — "Danny Boy," every single morning, like clockwork. Ma would bang on the door and say "Bobby, you\'re scaring the dog," and he\'d sing louder. He met my mother at a dance in 1944 and loved her for fifty-three years. He once told me the secret to a good marriage: "Listen more than you talk, and when she\'s right — which is most of the time — say so." He fixed everything that was broken and never broke anything that was whole. We should all be so lucky.',
    memory_type: 'text',
    memory_date: '1998-08-07',
    location: 'St. Mary\'s Church, Boston',
    personKeys: ['robert', 'michael_s', 'elena'],
    tags: ['eulogy', 'tribute', 'loss', 'father'],
  });

  await mem({
    title: 'Paul Martinelli Teaching Anthony to Make Cannoli',
    content: 'Video of Paul Martinelli teaching his son Anthony the family cannoli recipe in the bakery kitchen, 1995. Anthony is fifteen, wearing a flour-dusted apron that\'s too big for him. Paul guides his hands through the dough, showing him how thin to roll it. "Feel it with your fingers — your grandmother Rosa could tell when the dough was right just by touching it. Your great-grandmother taught her, and she taught me, and now I\'m teaching you." Anthony asks if they can try adding chocolate. Paul says "Your mother already suggested dulce de leche. What is wrong with this family?" But he\'s smiling. The video ends with both of them eating warm cannoli, leaning against the counter, not talking, just enjoying. Anthony took over the bakery in 2010.',
    memory_type: 'video',
    memory_date: '1995-03-22',
    location: 'Martinelli\'s Bakery, Brooklyn, NY',
    personKeys: ['paul_m', 'anthony_m', 'rosa'],
    tags: ['baking', 'tradition', 'father and son', 'recipe', 'family business'],
  });

  // --- 2000s-Present ---

  await mem({
    title: 'Emily and Jake\'s Wedding — Branches United',
    content: 'When Emily Sullivan married Jake Davis in 2008, it connected two branches of the extended family that had been separate since the 1940s. Emily is the granddaughter of Robert Sullivan and Elena Martinelli. Jake is the grandson of Lucia Martinelli and Frank Davis. They share great-grandparents: Giuseppe and Rosa Martinelli. They met at a family reunion and didn\'t realize they were related until Peggy Martinelli — the family genealogist — pointed it out. "Third cousins," Peggy announced, studying her charts. "Perfectly legal." The wedding combined Sullivan stubbornness, Martinelli food, and Davis music. Frankie played piano while Jennifer sang. The cake was from Martinelli\'s Bakery — where else?',
    memory_type: 'photo',
    memory_date: '2008-06-21',
    location: 'Prospect Park Boathouse, Brooklyn, NY',
    personKeys: ['emily_s', 'jake_d', 'frank_jr', 'jennifer_d', 'peggy_m'],
    tags: ['wedding', 'family connection', 'reunion', 'celebration'],
  });

  await mem({
    title: 'Ethan O\'Brien\'s Debut Album: "Three Rivers"',
    content: 'Ethan O\'Brien — grandson of Sofia Martinelli and William Chen, son of Grace Chen and Kevin O\'Brien — released his debut album "Three Rivers" in 2015. It fuses traditional Chinese erhu with jazz piano and Irish fiddle, representing his three cultural streams. Track listing includes "Nonna Rosa\'s Kitchen" (a warm, aromatic piece that somehow sounds like Sunday gravy simmering), "Ellis Island Arrival" (based on the family story of Giuseppe\'s 1912 journey), and "Tea and Whiskey" (about his grandparents\' wedding). The album reached #4 on the World Music charts. Sofia, then 84, attended the release concert and said it was the most beautiful thing she\'d heard since her sister Lucia sang.',
    memory_type: 'audio',
    memory_date: '2015-09-18',
    location: 'Brooklyn Academy of Music',
    personKeys: ['ethan_o', 'sofia', 'william_c', 'grace_c', 'kevin_o', 'rosa', 'giuseppe', 'lucia'],
    tags: ['music', 'album', 'multicultural', 'heritage', 'achievement'],
  });

  await mem({
    title: 'Brian Anderson\'s Restaurant Opening: "Radici"',
    content: 'Brian Anderson — great-grandson of both Harold Sullivan and Giuseppe Martinelli — opened "Radici" (Italian for "roots") in 2012. The restaurant\'s concept: dishes that fuse the Irish, Italian, and Chinese cuisines of his extended family. Signature dishes include "Nonna\'s Meatballs with Colcannon," "Soy-Glazed Braciole," and "Cannoli Egg Rolls." The walls are covered with family photos spanning a hundred years. There\'s a framed copy of Giuseppe\'s Ellis Island entry document by the front door, and a photo of Margaret\'s cast iron pot behind the bar. Food critics called it "heritage cooking at its most personal." Brian says every dish tells a family story. His grandmother Dorothy was his biggest supporter — she ate there every Thursday until she was 92.',
    memory_type: 'photo',
    memory_date: '2012-10-05',
    location: 'Radici Restaurant, Brooklyn, NY',
    personKeys: ['brian_a', 'dorothy', 'giuseppe', 'margaret'],
    tags: ['restaurant', 'food', 'heritage', 'business', 'multicultural'],
  });

  await mem({
    title: 'Lucas Torres Graduating from Fire Academy',
    content: 'Photo of Lucas Patrick Torres graduating from the fire academy, 2009. He\'s the fourth generation of Sullivan firefighters: his great-grandfather Thomas, his great-uncle John, and now Lucas — though his name is Torres. His mother Karen (Thomas\'s daughter) pinned his badge. His grandfather Thomas had died four years earlier, but his helmet was placed on an empty chair in the front row. John Sullivan, now a battalion chief, administered the oath. When Lucas raised his right hand, half the academy audience was family. Steven Sullivan, Lucas\'s great-uncle and high school football coach, was heard yelling "THAT\'S MY NEPHEW!" loud enough to echo off the walls. Thomas would have been proud. He would also have told Lucas his posture needed work.',
    memory_type: 'photo',
    memory_date: '2009-05-15',
    location: 'Fire Academy, Boston, MA',
    personKeys: ['lucas_t', 'karen_s', 'john_s', 'thomas_s', 'steven_s'],
    tags: ['firefighter', 'graduation', 'legacy', 'tradition', 'achievement'],
  });

  await mem({
    title: 'The Last Thanksgiving at Dominic\'s, 2019',
    content: 'Dominic Martinelli hosted Thanksgiving every year from 1975 to 2019. The last one — before he passed in April 2020 — had sixty-two people. Peggy organized the seating chart. The menu was: turkey (Helen\'s recipe), lasagna (Rosa\'s recipe via Elena), Irish soda bread (Margaret\'s recipe via Dorothy), dumplings (Mei-Ling\'s recipe via Bill Chen), and sweet potato pie (a Davis family addition from Frank\'s mother). Dominic gave a toast: "My father came to this country with forty cents and a bag of tools. Look what he built." He gestured at the room full of people. There wasn\'t a dry eye. DJ got it on video. It was the last time the whole family was together before COVID. Dominic died alone in a hospital room five months later. The video has been watched by every member of the family more times than anyone can count.',
    memory_type: 'video',
    memory_date: '2019-11-28',
    location: 'Martinelli home, Staten Island, NY',
    personKeys: ['dominic', 'peggy_m', 'dom_jr', 'giuseppe'],
    tags: ['thanksgiving', 'tradition', 'last gathering', 'family', 'covid'],
  });

  await mem({
    title: 'Mia O\'Brien\'s Sustainable Building Award',
    content: 'Mia Grace O\'Brien received the AIA Young Architect Award in 2020 for her sustainable community center design on Atlantic Avenue — the same block where her great-grandmother Rosa once ran a tailoring shop. The building uses reclaimed materials from demolished structures in the neighborhood, including bricks from the original building where Rosa\'s shop stood. The center\'s interior features a "Memory Wall" where community members can post photos and stories of the neighborhood\'s past. At the award ceremony, Mia said: "My great-grandmother measured people for clothes. I measure spaces for communities. She taught me — through the stories my grandmother told — that every space should make people feel seen." Her mother Grace, also an architect, presented the award.',
    memory_type: 'text',
    memory_date: '2020-02-15',
    location: 'Atlantic Avenue, Brooklyn, NY',
    personKeys: ['mia_o', 'grace_c', 'rosa'],
    tags: ['architecture', 'award', 'heritage', 'sustainable design'],
  });

  await mem({
    title: 'David Wright\'s Column: "The House My Father Built"',
    content: 'Journalist David James Wright published a column in the Boston Globe in 2005 about the house his father Jim built by hand in 1953. Excerpt: "My father was a quiet man who expressed love through lumber. He couldn\'t say \'I love you\' without looking at his shoes, but he could build a bookshelf that would outlast him by a century. The house at 15 Elm Street has survived three nor\'easters, a hurricane, and every clumsy modification I\'ve made since inheriting it. The floors still don\'t creak. The doors still close silently. The window frames are still true. Dad built this house the way he lived his life: carefully, precisely, and with an attention to joints and connections that most people never notice. I live in this house alone now, but I am never alone in it. Every room has his fingerprints — literally, if you know where to look, pressed into the wood putty of the kitchen windowsill, 1953, still there."',
    memory_type: 'text',
    memory_date: '2005-06-19',
    location: 'Boston Globe offices, Boston, MA',
    personKeys: ['david_w', 'james_w', 'dorothy'],
    tags: ['writing', 'tribute', 'craftsmanship', 'home', 'father'],
  });

  await mem({
    title: 'Sofia Chen\'s 90th Birthday — Five Generations',
    content: 'Sofia Rosa Chen (née Martinelli) celebrated her 90th birthday in 2021 with a gathering in Prospect Park — the same park where her father Giuseppe played bocce every Sunday. Five generations were represented: Sofia herself, her children Grace/Henry/Lily, her grandchildren Mia/Ethan and others, and the newest addition: Mia\'s daughter Rosalina, born three months earlier and named after Nonna Rosa. Sofia held the baby and said: "My father came here from Sicily with forty cents. My mother sewed dresses for strangers. And look — look at what they started." Henry made dumplings. Ethan played erhu. Grace pointed out the architectural features of the new community center visible from the park. Lily, the oncologist, checked everyone\'s moles and told three people to see their dermatologist. It was, by all accounts, a perfect day.',
    memory_type: 'photo',
    memory_date: '2021-03-25',
    location: 'Prospect Park, Brooklyn, NY',
    personKeys: ['sofia', 'grace_c', 'henry_c', 'lily_c', 'mia_o', 'ethan_o', 'giuseppe', 'rosa'],
    tags: ['birthday', 'milestone', 'five generations', 'celebration', 'family gathering'],
  });

  await mem({
    title: 'Margaret Sullivan\'s Rose Garden',
    content: 'Margaret O\'Connell Sullivan maintained a rose garden at 42 Maple Street for fifty-nine years, from the day Harold brought her the first bush as a wedding gift in 1919 until she died in 1978. She grew fourteen varieties including her pride: a deep red hybrid tea she called "Kerry Sunset" after her mother\'s home county. She talked to the roses every morning while drinking tea. Harold built the trellis and the garden gate, which still bears his initials carved into the corner post. After Margaret died, Dorothy took cuttings from every bush and planted them at her own house. Elena took the Kerry Sunset. Lisa Sullivan paints the garden from memory every spring — she has a series of fourteen watercolors, one for each variety, hanging in the family room of the old Sullivan house.',
    memory_type: 'text',
    memory_date: '1970-06-15',
    location: '42 Maple Street, Boston, MA',
    personKeys: ['margaret', 'harold', 'dorothy', 'elena', 'lisa_s'],
    tags: ['garden', 'roses', 'heirloom', 'nature', 'tradition'],
  });

  await mem({
    title: 'Tony and Catherine\'s Kitchen Arguments',
    content: 'Audio recording — actually a series of recordings compiled by Maria Martinelli for a 2010 family event. Tony and Catherine Martinelli argued about food every single day for forty-nine years. Tony: "You cannot put butter in marinara sauce!" Catherine: "It\'s not butter, it\'s flavor." Tony: "It\'s IRISH flavor! This is an ITALIAN kitchen!" Catherine: "This is an American kitchen in Brooklyn and I\'ll put whatever I want in whatever I want." These arguments were legendary. Every child and grandchild can recite them from memory. Maria recorded several on a hidden tape recorder in the 1980s. The truth is, Catherine\'s butter-enriched marinara was delicious, and Tony ate three bowls every time she made it. He just never admitted it while she was in the room.',
    memory_type: 'audio',
    memory_date: '1985-09-10',
    location: 'Martinelli home, Brooklyn, NY',
    personKeys: ['tony', 'catherine_o', 'maria_m'],
    tags: ['humor', 'cooking', 'marriage', 'italian-irish', 'tradition'],
  });

  await mem({
    title: 'The Martinelli Bakery, 70 Years Later',
    content: 'Photo essay documenting Martinelli\'s Bakery on its 70th anniversary, 2022. The bakery counter now displays cannoli alongside conchas, sfogliatelle next to churros. A framed photo of Tony and Catherine on their wedding day hangs behind the register. Next to it: a photo of Giuseppe laying the threshold stone in 1952. Anthony Martinelli, the fourth-generation baker, runs the place. His sister Sofia handles the legal work. The morning crew includes one person from every branch of the family — it\'s become a rite of passage. The cannoli recipe is unchanged from Nonna Rosa\'s original. Anthony added one thing to the menu that Rosa never made: a cookie he calls "The Nonna" — almond, anise, and just a hint of citrus. It\'s the bestseller.',
    memory_type: 'photo',
    memory_date: '2022-04-15',
    location: 'Court Street, Brooklyn, NY',
    personKeys: ['anthony_m', 'sofia_m', 'tony', 'catherine_o', 'giuseppe', 'rosa'],
    tags: ['bakery', 'anniversary', 'business', 'legacy', 'family business'],
  });

  await mem({
    title: 'Isabella Torres\'s First Save',
    content: 'Isabella Rose Torres, emergency physician, performed her first solo emergency surgery during her residency in 2010. The patient was a construction worker with a ruptured spleen. Isabella was the only attending available. She stabilized him, got him to the OR, and saved his life. When she called her mother Karen to tell her, Karen — a pediatrician — cried. When she called her grandfather George Henderson — the family\'s first doctor — he said: "That\'s three generations of healers now. Your great-aunt Mary would be proud." Mary Sullivan Henderson, the nurse who worked at Mass General for forty years, had died two years earlier. Isabella keeps a photo of Mary in her locker at the hospital. Below it, she wrote: "Save lives. Skip lunch. Repeat."',
    memory_type: 'text',
    memory_date: '2010-07-14',
    location: 'Massachusetts General Hospital, Boston',
    personKeys: ['isabella_t', 'karen_s', 'george_h', 'mary_s'],
    tags: ['medicine', 'achievement', 'legacy', 'first save', 'healing'],
  });

  await mem({
    title: 'Ryan Sullivan Building the Family Memory App',
    content: 'Ryan Michael Sullivan, software developer and great-great-grandson of both Harold Sullivan and Giuseppe Martinelli, built this family memory app in 2026 after his great-aunt Peggy Martinelli — the family genealogist — said she was worried that all her binders of family documents and photos would be lost when she was gone. "Someone needs to put this in a computer," she said. Ryan spent six months building it. He used every piece of technology at his disposal: local AI for understanding and connecting memories, vector search for finding stories by meaning instead of just keywords, and a family tree that shows how everyone is connected. The first memory he entered was Giuseppe\'s Ellis Island story. The second was Nonna Rosa\'s gravy recipe. Peggy, 90 years old and living in Florida, video-called to see it and said: "Finally. Now they can\'t lose us."',
    memory_type: 'text',
    memory_date: '2026-03-12',
    location: 'Boston, MA',
    personKeys: ['ryan_s', 'peggy_m', 'giuseppe', 'rosa'],
    tags: ['technology', 'preservation', 'meta', 'family project'],
  });

  await mem({
    title: 'Christmas Eve at Elena\'s, 1980',
    content: 'Audio recording of the Sullivan-Martinelli Christmas Eve gathering, 1980. You can hear children running, plates clattering, Frank Davis playing "White Christmas" on saxophone in the living room while Lucia sings along. Elena and Rosa are arguing in Italian about whether the baccalà needs more salt. Margaret is teaching Karen how to make eggnog. Someone — probably Steven, age 22 — is setting off firecrackers in the backyard and Helen is yelling at him to stop. Harold\'s laugh — that booming, unmistakable Harold laugh — rises above everything. He died two years later. This is the last recording of his voice. Dorothy kept the tape. She listened to it every Christmas Eve for the rest of her life.',
    memory_type: 'audio',
    memory_date: '1980-12-24',
    location: 'Sullivan home, Brookline, MA',
    personKeys: ['elena', 'rosa', 'harold', 'margaret', 'frank_d', 'lucia', 'steven_s', 'helen_b', 'dorothy', 'karen_s'],
    tags: ['christmas', 'holiday', 'audio', 'last recording', 'family gathering'],
  });

  await mem({
    title: 'Jennifer Davis Singing at Jake and Emily\'s Wedding',
    content: 'Video of Jennifer Davis performing "At Last" by Etta James at the wedding of Emily Sullivan and Jake Davis, 2008. Jennifer, who spent fifteen years in Broadway choruses, delivered a performance that stopped the reception cold. The song was significant: it was the same song that Robert and Elena danced to at their wedding in 1945. Emily chose it deliberately — she\'d heard the story from her father Michael, who heard it from his mother Elena. In the video, you can see Michael in the background, hand over his heart. Across the table, Frankie is crying into his napkin. The song connects 1945 to 2008, two weddings sixty-three years apart, in a family where music has always been the thread that holds everything together.',
    memory_type: 'video',
    memory_date: '2008-06-21',
    location: 'Prospect Park Boathouse, Brooklyn, NY',
    personKeys: ['jennifer_d', 'emily_s', 'jake_d', 'michael_s', 'frank_jr', 'robert', 'elena'],
    tags: ['wedding', 'singing', 'tradition', 'at last', 'connection'],
  });

  await mem({
    title: 'Dominic\'s Final Thanksgiving Toast, 2019',
    content: 'Full transcript of Dominic Martinelli\'s Thanksgiving toast, November 28, 2019. "Sit down, sit down, I\'ll be quick. I say the same thing every year and every year Peggy tells me to change it, but I won\'t, because some things are worth repeating. My father came to this country in 1912 with forty cents and a bag of tools. He didn\'t speak English. He was seventeen years old and alone. He built a life — stone by stone, literally — and he built a family. My mother could look at a stranger and know their measurements. She could look at any one of us and know exactly what we needed. They gave us everything. And we — all of us in this room — we are what they built. Sixty-two people. Doctors, teachers, firefighters, bakers, lawyers, musicians, architects. One journalist who won\'t stop asking questions. Three babies who can\'t even walk yet but who will grow up knowing this story. Salute." He raised his glass. Five months later, he was gone.',
    memory_type: 'text',
    memory_date: '2019-11-28',
    location: 'Martinelli home, Staten Island, NY',
    personKeys: ['dominic', 'giuseppe', 'rosa', 'peggy_m'],
    tags: ['thanksgiving', 'toast', 'tribute', 'immigration', 'legacy'],
  });

  await mem({
    title: 'Marco Coaching the Championship Game, 1978',
    content: 'Video footage from the Jefferson Hawks vs. Central Lions city championship baseball game, 1978. Marco Martinelli in the dugout, clipboard in hand, chewing on a pencil the way he always did. Bottom of the ninth, down by one, two outs. Marco signals for a bunt — everyone in the stands thinks he\'s lost his mind. The bunt is perfect. Runner advances to third. Next batter hits a double. Hawks win 5-4. Marco is lifted onto his players\' shoulders. Betty is in the stands screaming. His daughter Christina, age 21, is keeping the official scorebook — she\'s been the team statistician since she was twelve. This was the second of Marco\'s three city championships. The trophy case at Jefferson High still has his photo above it.',
    memory_type: 'video',
    memory_date: '1978-06-10',
    location: 'Jefferson High School, Brooklyn, NY',
    personKeys: ['marco', 'betty_j', 'christina_m'],
    tags: ['baseball', 'coaching', 'championship', 'sports', 'strategy'],
  });

  await mem({
    title: 'The Night Harold and Giuseppe Became Friends',
    content: 'At Robert and Elena\'s wedding reception in 1945, Harold Sullivan and Giuseppe Martinelli — who had barely spoken during the courtship — ended up at the same table during the meal. Harold was an Irish-American shipyard man. Giuseppe was a Sicilian stonemason. They had nothing in common except their children\'s love for each other. Then someone brought out a deck of cards. Harold suggested poker. Giuseppe countered with scopa. They compromised: they played both, alternating games. By midnight, they\'d finished a bottle of grappa that Giuseppe had been saving since 1930, taught each other twelve words in their respective languages, and agreed that the Red Sox were better than the Dodgers (Giuseppe was lying, but it seemed important). From that night until Harold died in 1972, they met every Saturday for cards, grappa, and arguments about baseball. Margaret and Rosa would sit in the kitchen and shake their heads. They understood each other perfectly without needing cards.',
    memory_type: 'text',
    memory_date: '1945-10-13',
    location: 'St. Mary\'s Church reception hall, Boston',
    personKeys: ['harold', 'giuseppe', 'robert', 'elena', 'margaret', 'rosa'],
    tags: ['friendship', 'wedding', 'cross-cultural', 'card games', 'family bond'],
  });
}

// ─────────────────────────────────────────────────────────────────────
// RUN EVERYTHING
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌳 Seeding Sullivan-Martinelli family tree...\n');

  // Verify server is up
  try {
    const health = await fetch(`${BASE}/api/health`);
    if (!health.ok) throw new Error('Server not healthy');
    console.log('✓ Server is healthy');
  } catch {
    console.error('✗ Server is not running at ' + BASE);
    console.error('  Start with: cd server && npm run dev');
    process.exit(1);
  }

  await seedGen0();
  await seedGen1();
  await seedGen2();
  await seedGen3();
  await seedMemories();

  console.log('\n═══════════════════════════════════════════');
  console.log(`✓ Created ${memberCount} family members`);
  console.log(`✓ Created ${relCount} relationships`);
  console.log(`✓ Created ${memoryCount} memories`);
  console.log('═══════════════════════════════════════════');
  console.log('\nOpen http://localhost:5173 to see the family tree!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
