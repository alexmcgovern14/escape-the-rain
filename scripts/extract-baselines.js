// Extract POI baselines from the terminal output
// This parses the output to count presence of each POI type

const output = `
Edinburgh: museums, attractions, sights, cinema, sports, shopping, pubs, cafes, restaurants, shops
Glasgow: stadiums, museums, attractions, sights, cinema, shopping, pubs, parks, cafes, restaurants, shops
Cardiff: museums, sports, shopping, pubs, cafes, restaurants, shops
Newcastle: stadiums, museums, attractions, shopping, pubs, restaurants
Nottingham: stadiums, museums, attractions, playgrounds, sports, shopping, pubs, parks, cafes, restaurants
Leicester: stadiums, museums, cinema, shopping, pubs, parks, cafes, restaurants, shops
Brighton: museums, attractions, shopping, pubs, cafes, restaurants
Oxford: museums, attractions, cinema, sports, shopping, pubs, parks, cafes, restaurants
Cambridge: museums, attractions, sports, shopping, pubs, cafes, restaurants, shops
York: museums, attractions, sights, shopping, pubs, parks, cafes, restaurants, shops
Bath: museums, attractions, shopping, pubs, parks, cafes, restaurants, shops
Reading: museums, attractions, sights, cinema, sports, shopping, pubs, cafes, restaurants, shops
Milton Keynes: museums, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Southampton: museums, shopping, pubs, cafes, restaurants, shops
Portsmouth: museums, attractions, sights, shopping, pubs, parks, restaurants, shops
Norwich: museums, attractions, sights, shopping, pubs, cafes, restaurants, shops
Ipswich: museums, cinema, shopping, pubs, cafes, restaurants, shops
Colchester: museums, attractions, shopping, pubs, cafes, restaurants, shops
Chelmsford: museums, sports, shopping, pubs, cafes, restaurants, shops
Canterbury: museums, shopping, pubs, cafes, restaurants, shops
Guildford: museums, cinema, sports, shopping, pubs, cafes, restaurants, shops
Wakefield: museums, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Bradford: museums, attractions, cinema, sports, shopping, pubs, cafes, restaurants, shops
Huddersfield: museums, shopping, pubs, restaurants
Harrogate: forests, museums, attractions, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Doncaster: nature reserves, stadiums, museums, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Rotherham: (error - skip)
Barnsley: stadiums, museums, attractions, sports, shopping, pubs, parks, cafes, restaurants, shops
Stockport: museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Bolton: museums, sports, shopping, pubs, cafes, restaurants, shops
Warrington: museums, shopping, pubs, cafes, restaurants, shops
Blackpool: museums, attractions, sights, shopping, pubs, parks, cafes, restaurants, shops
Preston: museums, attractions, playgrounds, sights, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Chester: museums, shopping, pubs, cafes, restaurants, shops
Derby: museums, sights, sports, shopping, pubs, cafes, restaurants, shops
Stoke-on-Trent: stadiums, museums, cinema, sports, shopping, pubs, restaurants, shops
Otley: attractions, sights, sports, shopping, pubs, cafes, restaurants, shops
Ilkley: nature reserves, museums, attractions, sights, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Knaresborough: nature reserves, forests, museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Ripon: nature reserves, museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Wetherby: forests, attractions, sights, cinema, sports, shopping, pubs, parks, restaurants, shops
Tadcaster: nature reserves, forests, attractions, sights, sports, shopping, pubs, parks, restaurants, shops
Selby: museums, sights, sports, shopping, pubs, restaurants, shops
Pontefract: museums, attractions, sights, markets, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Castleford: museums, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Great Yarmouth: nature reserves, museums, attractions, playgrounds, cinema, sports, shopping, pubs, restaurants, shops
Lowestoft: museums, shopping, pubs, restaurants, shops
Cromer: nature reserves, museums, attractions, sights, sports, shopping, pubs, cafes, restaurants, shops
Sheringham: nature reserves, museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Fakenham: nature reserves, museums, attractions, sights, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Dereham: nature reserves, museums, attractions, sights, cinema, shopping, pubs, parks, cafes, restaurants, shops
Wymondham: museums, attractions, sports, shopping, pubs, cafes, restaurants, shops
Thetford: nature reserves, forests, museums, attractions, sights, sports, shopping, pubs, cafes, restaurants, shops
King's Lynn: forests, museums, attractions, sights, cinema, sports, shopping, pubs, cafes, restaurants, shops
Wisbech: museums, attractions, cinema, sports, shopping, pubs, cafes, restaurants, shops
Hunstanton: nature reserves, museums, attractions, sights, shopping, pubs, parks, cafes, restaurants, shops
Beccles: nature reserves, museums, attractions, sights, sports, shopping, pubs, cafes, restaurants, shops
Bungay: nature reserves, museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Southwold: nature reserves, museums, attractions, sights, shopping, pubs, parks, cafes, restaurants, shops
Aldeburgh: nature reserves, forests, museums, attractions, sights, cinema, sports, shopping, pubs, restaurants, shops
Woodbridge: nature reserves, museums, sights, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
Felixstowe: nature reserves, museums, attractions, sights, cinema, shopping, pubs, cafes, restaurants, shops
Maidstone: stadiums, museums, attractions, cinema, shopping, pubs, cafes, restaurants, shops
Tunbridge Wells: museums, sports, shopping, pubs, cafes, restaurants, shops
Sevenoaks: nature reserves, museums, attractions, playgrounds, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Reigate: nature reserves, museums, attractions, cinema, sports, shopping, pubs, cafes, restaurants, shops
Epsom: nature reserves, forests, museums, attractions, cinema, shopping, pubs, parks, cafes, restaurants, shops
Windsor: nature reserves, stadiums, museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Maidenhead: nature reserves, stadiums, forests, museums, attractions, sights, cinema, sports, shopping, parks, cafes, restaurants, shops
Henley-on-Thames: nature reserves, forests, museums, attractions, sights, cinema, sports, shopping, pubs, parks, cafes, restaurants, shops
High Wycombe: nature reserves, museums, attractions, sights, cinema, sports, shopping, pubs, parks, restaurants, shops
Aylesbury: museums, cinema, sports, shopping, pubs, restaurants, shops
St Albans: museums, sights, cinema, sports, shopping, pubs, cafes, restaurants, shops
Watford: sports, shopping, pubs, parks, cafes, restaurants, shops
Harlow: museums, attractions, sports, shopping, pubs, parks, cafes, restaurants, shops
Basildon: museums, sports, shopping, pubs, cafes, restaurants, shops
Southend-on-Sea: museums, attractions, sports, shopping, pubs, restaurants, shops
Brentwood: sports, shopping, pubs, cafes, restaurants, shops
Romford: nature reserves, museums, sports, shopping, pubs, parks, cafes, restaurants, shops
Dartford: nature reserves, stadiums, sports, shopping, pubs, parks, cafes, restaurants
Gravesend: museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
Rochester: museums, attractions, sights, sports, shopping, pubs, parks, cafes, restaurants
Whitstable: museums, sports, shopping, pubs, cafes, restaurants, shops
Herne Bay: museums, attractions, sights, cinema, sports, shopping, pubs, cafes, restaurants, shops
Margate: museums, attractions, sports, shopping, cafes, restaurants, shops
Ramsgate: museums, attractions, shopping, pubs, cafes, restaurants, shops
Broadstairs: museums, attractions, cinema, sports, shopping, pubs, cafes, restaurants, shops
Horsham: museums, sports, shopping, pubs, cafes, restaurants, shops
Crawley: stadiums, museums, sports, shopping, pubs, cafes, restaurants, shops
Worthing: nature reserves, museums, cinema, sports, shopping, pubs, cafes, restaurants, shops
Bognor Regis: museums, cinema, shopping, pubs, cafes, restaurants, shops
Chichester: museums, attractions, sights, cinema, shopping, pubs, cafes, restaurants, shops
Arundel: nature reserves, forests, museums, attractions, playgrounds, sights, sports, shopping, pubs, parks, cafes, restaurants, shops
`;

// Parse the output
const lines = output.split('\n').filter(line => line.trim() && !line.includes('error'));
const poiCounts = new Map();

lines.forEach(line => {
  const match = line.match(/:\s*(.+)$/);
  if (match) {
    const poiTypes = match[1].split(',').map(s => s.trim()).filter(s => s && s !== '(error - skip)');
    poiTypes.forEach(type => {
      poiCounts.set(type, (poiCounts.get(type) || 0) + 1);
    });
  }
});

const totalLocations = lines.length;
const baselines = {};

// Sort by count descending
const sorted = Array.from(poiCounts.entries()).sort((a, b) => b[1] - a[1]);

sorted.forEach(([type, count]) => {
  const frequency = count / totalLocations;
  baselines[type] = frequency;
  console.log(`${type.padEnd(25)} | ${frequency.toFixed(3).padStart(5)} | ${(frequency * 100).toFixed(1).padStart(5)}% | ${count.toString().padStart(3)}/${totalLocations}`);
});

console.log('\n=== BASELINE DATA (copy to constants) ===');
console.log(JSON.stringify(baselines, null, 2));



