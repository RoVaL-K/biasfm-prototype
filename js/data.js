// js/data.js — Kanonischer Katalog & Datensatz für bias.fm
// Basiert auf handover.md v2: Idol, Indie, Hiphop, R&B, Produzenten als First-Class Entities.

const BIAS_DATA = {
  fandomColors: [
    { id: 'pink', name: 'Blink Pink', color: '#ff4d6d', fandom: 'BLACKPINK' },
    { id: 'purple', name: 'Borahae Purple', color: '#8b5cf6', fandom: 'BTS' },
    { id: 'blue', name: 'Tokki Sky Blue', color: '#38bdf8', fandom: 'NewJeans' },
    { id: 'mint', name: 'Neo Mint Champagne', color: '#34d399', fandom: 'NCT' },
    { id: 'gold', name: 'Coral Sunshine', color: '#fbbf24', fandom: 'Red Velvet' },
    { id: 'orange', name: 'Shinhwa Tangerine', color: '#f97316', fandom: 'Shinhwa' },
    { id: 'crimson', name: 'Pearl Red', color: '#e11d48', fandom: 'TVXQ' },
    { id: 'mono', name: 'Minimalist Steel', color: '#94a3b8', fandom: 'Neutral' }
  ],

  artists: [
    {
      id: 'newjeans',
      name: 'NewJeans',
      hangul: '뉴진스',
      romanized: 'Nyujinseu',
      aliases: ['NJ', 'NWJNS', 'ニュージーンズ'],
      type: 'group',
      agency: 'ADOR',
      debutYear: 2022,
      generation: '4th Gen',
      fandomColor: '#38bdf8',
      fandomName: 'Bunnies (버니즈)',
      genres: ['Idol', 'Pop', 'R&B', 'Jersey Club'],
      bio: 'Fünfköpfige Girlgroup gegründet von Min Hee-jin unter ADOR (HYBE). Ihr minimalistischer Y2K-Sound brach radikal mit maximalistischem K-Pop und definierte 2022/2023 das Genre neu. Produziert maßgeblich von 250 und FRNK.',
      members: [
        { name: 'Minji', hangul: '민지', role: 'Leader, Vocal' },
        { name: 'Hanni', hangul: '하니', role: 'Main Vocal, Dancer' },
        { name: 'Danielle', hangul: '다니엘', role: 'Vocal, Lyrics' },
        { name: 'Haerin', hangul: '해린', role: 'Dancer, Vocal' },
        { name: 'Hyein', hangul: '혜인', role: 'Vocal, Maknae' }
      ],
      associatedProducers: ['prod-250', 'prod-frnk'],
      mbid: '4d805828-574a-4a24-b1eb-b31c2c31e9a2',
      monthlyListeners: 18420000,
      totalScrobbles: 142850
    },
    {
      id: 'sumin',
      name: 'SUMIN',
      hangul: '수민',
      romanized: 'Sumin',
      aliases: ['Sumin Park', '박수민'],
      type: 'solo',
      agency: 'Independent / Wave',
      debutYear: 2015,
      generation: 'Solo / Indie',
      fandomColor: '#8b5cf6',
      fandomName: 'Neo Lovers',
      genres: ['R&B', 'Neo-Soul', 'Indie', 'Electronic'],
      bio: 'Sängerin, Songwriterin, Beatmakerin und Produzentin. SUMIN ist das Bindeglied zwischen Underground-Neo-Soul und Mainstream-Idol-Pop (Credits für Red Velvet, BTS, BoA, IU). Ihr Kollabo-Album „MINISERIES“ mit Slom gilt als Meilenstein koreanischer Musik der 2020er.',
      members: null,
      associatedProducers: ['prod-slom', 'sumin'],
      mbid: '9f6b64d1-58e1-456d-b8d4-f6bcf9a3bc47',
      monthlyListeners: 840000,
      totalScrobbles: 64200
    },
    {
      id: 'black-skirts',
      name: '검정치마 The Black Skirts',
      hangul: '검정치마',
      romanized: 'Geomjeongchima',
      aliases: ['The Black Skirts', 'Jo Hyu-il', '조휴일'],
      type: 'solo',
      agency: 'BESPOK / Highgrnd (vormals)',
      debutYear: 2008,
      generation: 'Indie Legend',
      fandomColor: '#34d399',
      fandomName: 'Skirters',
      genres: ['Indie', 'Rock', 'Dream Pop', 'Lo-Fi'],
      bio: 'Hinter The Black Skirts steht Songwriter Jo Hyu-il. Seit seinem Debütalbum „201“ gehört er zu den einflussreichsten Stimmen des koreanischen Indie-Rock. Seine melancholischen Hymnen wie „Antifreeze“ und „Everything“ werden von Idols und Underground gleichermaßen gecovert.',
      members: null,
      associatedProducers: ['black-skirts'],
      mbid: '0fc4f3be-b9b5-4a61-8935-cf227fb63a6c',
      monthlyListeners: 1450000,
      totalScrobbles: 95400
    },
    {
      id: 'se-so-neon',
      name: '새소년 SE SO NEON',
      hangul: '새소년',
      romanized: 'Saesonyeon',
      aliases: ['SESONEON', 'Hwang So-yoon', 'So!YoON!'],
      type: 'group',
      agency: 'Magic Strawberry Sound',
      debutYear: 2017,
      generation: 'Indie / Alt-Rock',
      fandomColor: '#f97316',
      fandomName: 'New Kids (새소년들)',
      genres: ['Indie', 'Psychedelic Rock', 'Blues', 'Post-Punk'],
      bio: 'Getrieben von Hwang So-yoons rauchiger Stimme und virtuosem Gitarrenspiel sprengt SE SO NEON traditionelle Rock-Grenzen. Gewinner des Korean Music Awards für Rookie of the Year und Best Rock Song („The Wave“).',
      members: [
        { name: 'Hwang So-yoon (So!YoON!)', hangul: '황소윤', role: 'Vocal, Guitar, Producer' },
        { name: 'Park Hyun-jin', hangul: '박현진', role: 'Bass' }
      ],
      associatedProducers: ['se-so-neon'],
      mbid: '86fb5359-e91d-40aa-b956-f8319f6a27e7',
      monthlyListeners: 620000,
      totalScrobbles: 41800
    },
    {
      id: 'gidle',
      name: '(여자)아이들 (G)I-DLE',
      hangul: '(여자)아이들',
      romanized: 'Yeoja Aideul',
      aliases: ['(G)I-DLE', 'GIDLE', 'I-DLE', '여자아이들'],
      type: 'group',
      agency: 'Cube Entertainment',
      debutYear: 2018,
      generation: '4th Gen',
      fandomColor: '#e11d48',
      fandomName: 'Neverland (네버랜드)',
      genres: ['Idol', 'Alt-Rock', 'Hip Hop', 'Pop'],
      bio: 'Eine der wenigen selbst-produzierenden K-Pop-Girlgroups der Spitzenklasse. Leaderin Soyeon schreibt, komponiert und arrangiert die Titeltracks („TOMBOY“, „Nxde“, „Queencard“), die gesellschaftliche Tabus und Gender-Rollen thematisieren.',
      members: [
        { name: 'Soyeon', hangul: '소연', role: 'Leader, Main Rapper, Producer' },
        { name: 'Miyeon', hangul: '미연', role: 'Main Vocal' },
        { name: 'Minnie', hangul: '민니', role: 'Main Vocal, Producer' },
        { name: 'Yuqi', hangul: '우기', role: 'Lead Dancer, Sub Vocal, Producer' },
        { name: 'Shuhua', hangul: '슈화', role: 'Sub Vocal, Visual' }
      ],
      associatedProducers: ['soyeon', 'prod-gray'],
      mbid: 'c878ee50-4eb6-4444-be1f-1e967a57a8a6',
      monthlyListeners: 11200000,
      totalScrobbles: 118400
    },
    {
      id: 'bibi',
      name: 'BIBI',
      hangul: '비비',
      romanized: 'Bibi',
      aliases: ['Kim Hyung-seo', '김형서', 'Naked BIBI'],
      type: 'solo',
      agency: 'Feel Ghood Music / 88rising',
      debutYear: 2019,
      generation: 'Solo / R&B',
      fandomColor: '#ff4d6d',
      fandomName: 'Bibi Bullet',
      genres: ['R&B', 'Hiphop', 'Indie', 'Alternative Pop'],
      bio: 'Entdeckt von Tiger JK und Yoon Mi-rae auf SoundCloud. BIBI verbindet ungeschminkte, rohe Texte über Trauma, Lust und Einsamkeit mit cineastischem Storytelling. Ihr Megahit „밤양갱 (Bam Yanggaeng)“ zeigte 2024 eine wundersame Chanson-Facette und dominierte alle Charts.',
      members: null,
      associatedProducers: ['prod-slom', 'prod-gray'],
      mbid: '9547d25e-e47e-4ee2-bbcb-1f204859a16f',
      monthlyListeners: 7800000,
      totalScrobbles: 87300
    },
    {
      id: 'aespa',
      name: 'aespa',
      hangul: '에스파',
      romanized: 'Eseupa',
      aliases: ['æspa', 'エスパ'],
      type: 'group',
      agency: 'SM Entertainment',
      debutYear: 2020,
      generation: '4th Gen',
      fandomColor: '#8b5cf6',
      fandomName: 'MY (마이)',
      genres: ['Idol', 'Hyperpop', 'Dance', 'Cyberpunk Pop'],
      bio: 'Vierköpfige Girlgroup mit Metaverse-Konzept. Bekannt für metallische Hyperpop- und Trap-Produktionen von Dem Jointz, Kenzie und Ryan Jhun. 2024 mit „Supernova“ und „Armageddon“ zum absoluten Trendsetter gekrönt.',
      members: [
        { name: 'Karina', hangul: '카리나', role: 'Leader, Main Dancer, Lead Rapper' },
        { name: 'Giselle', hangul: '지젤', role: 'Main Rapper, Sub Vocal' },
        { name: 'Winter', hangul: '윈터', role: 'Lead Vocal, Lead Dancer' },
        { name: 'Ningning', hangul: '닝닝', role: 'Main Vocal' }
      ],
      associatedProducers: ['kenzie', 'dem-jointz'],
      mbid: '5ce606e9-e092-4fcf-b6a4-68fae9ffb57e',
      monthlyListeners: 12500000,
      totalScrobbles: 131000
    },
    {
      id: 'younha',
      name: '윤하 YOUNHA',
      hangul: '윤하',
      romanized: 'Yoonha',
      aliases: ['Go Youn-ha', '고윤하', 'ユンナ'],
      type: 'solo',
      agency: 'C9 Entertainment',
      debutYear: 2004,
      generation: '2nd Gen / Vocalist',
      fandomColor: '#38bdf8',
      fandomName: 'Y.HOLICS',
      genres: ['Ballade', 'Pop-Rock', 'Piano Rock', 'OST'],
      bio: 'Ausnahmesängerin und Pianistin. Begann ihre Karriere 16-jährig in Japan („Comet“ / Bleach OST) und wurde in Korea zur Ikone für handgemachten Piano-Rock. Ihr Song „사건의 지평선 (Event Horizon)“ vollbrachte 2022 einen der legendärsten Chart-Umkehrmärsche der K-Pop-Geschichte.',
      members: null,
      associatedProducers: ['younha'],
      mbid: 'e010ae80-60a6-4fba-bb8f-e14bfe39bf24',
      monthlyListeners: 2100000,
      totalScrobbles: 78900
    },
    {
      id: 'crush',
      name: 'Crush',
      hangul: '크러쉬',
      romanized: 'Keureoswi',
      aliases: ['Shin Hyo-seob', '신효섭'],
      type: 'solo',
      agency: 'P NATION',
      debutYear: 2012,
      generation: '3rd Gen / R&B',
      fandomColor: '#fbbf24',
      fandomName: 'CrushBomb (크러쉬밤)',
      genres: ['R&B', 'Soul', 'Hip Hop', 'OST'],
      bio: 'Sänger, Songwriter und Producer der Fanxy Child Crew (mit Zico, Dean, Penomeco). Meister von samtigen Grooves und gefühlvollen TV-Dramen-Soundtracks („Beautiful“ / Goblin OST). Seine Zusammenarbeit „Rush Hour“ mit j-hope ging weltweit viral.',
      members: null,
      associatedProducers: ['prod-gray', 'crush'],
      mbid: '6ad8ffb1-91ff-48ea-aa36-05658e3782e4',
      monthlyListeners: 5400000,
      totalScrobbles: 82000
    },
    {
      id: 'ph-1',
      name: 'pH-1',
      hangul: '피에이치원',
      romanized: 'Pieichiwon',
      aliases: ['Park Jun-won', '박준원', 'Harry Park'],
      type: 'solo',
      agency: 'H1GHR MUSIC',
      debutYear: 2016,
      generation: 'Hiphop',
      fandomColor: '#f97316',
      fandomName: 'pH-1 Lovers',
      genres: ['Hiphop', 'Melodic Rap', 'R&B'],
      bio: 'Koreanisch-amerikanischer Rapper unter Jay Parks Label H1GHR MUSIC. Bekannt für melodischen, positiven Flow („Singing Rap“), smarte Wortspiele und genreübergreifende Kollaborationen mit Baek Ye-rin, Mokyo und GroovyRoom.',
      members: null,
      associatedProducers: ['prod-groovyroom', 'prod-chacha'],
      mbid: 'e1d1b0d2-97ee-4573-85f2-2b6348821cf3',
      monthlyListeners: 2800000,
      totalScrobbles: 51200
    },
    {
      id: 'dynamic-duo',
      name: '다이나믹 듀오 Dynamic Duo',
      hangul: '다이나믹 듀오',
      romanized: 'Dainamik Dyu-o',
      aliases: ['Dynamicduo', '다듀', 'Choiza', 'Gaeko'],
      type: 'group',
      agency: 'Amoeba Culture',
      debutYear: 2004,
      generation: 'Hiphop Pioneers',
      fandomColor: '#e11d48',
      fandomName: 'Amoeba Fam',
      genres: ['Hiphop', 'Boom Bap', 'K-Hiphop'],
      bio: 'Choiza und Gaeko prägten den koreanischen Rap wie kaum jemand sonst. Gegründet nach der Auflösung von CB Mass 2004. Ihr 2014er Klassiker „Smoke“ (mit Lee Young-ji) und „Guilty (죽일 놈)“ gehören zum kulturellen Allgemeingut Koreas.',
      members: [
        { name: 'Gaeko', hangul: '개코', role: 'Rapper, Vocal, Producer' },
        { name: 'Choiza', hangul: '최자', role: 'Rapper, Lyricist' }
      ],
      associatedProducers: ['prod-gray', 'dynamic-duo'],
      mbid: '3ff1d5fe-51b7-4c74-8bcf-62da8ad774eb',
      monthlyListeners: 3900000,
      totalScrobbles: 67100
    },
    {
      id: 'lee-hi',
      name: '이하이 LEE HI',
      hangul: '이하이',
      romanized: 'I Ha-i',
      aliases: ['Lee Ha-yi', 'LeeHi'],
      type: 'solo',
      agency: 'duover / AOMG (vormals) / YG',
      debutYear: 2012,
      generation: '3rd Gen / R&B',
      fandomColor: '#ff4d6d',
      fandomName: 'HiceCream',
      genres: ['R&B', 'Soul', 'Retro Pop', 'Ballade'],
      bio: 'Tiefe, vollmundige Soul-Stimme, die 2011 bei K-pop Star entdeckt wurde. Nach Jahren bei YG wechselte sie zu AOMG und entfaltete ihren Vintage-R&B-Sound („ONLY“, „HOLO“, „Breathe“ von Jonghyun geschrieben).',
      members: null,
      associatedProducers: ['prod-gray', 'prod-slom', 'code-kunst'],
      mbid: '01d78c94-0cf7-4f8a-986c-03eb98a72a1e',
      monthlyListeners: 4200000,
      totalScrobbles: 73400
    },
    {
      id: 'iu',
      name: '아이유 IU',
      hangul: '아이유',
      romanized: 'A-i-yu',
      aliases: ['Lee Ji-eun', '이지은'],
      type: 'solo',
      agency: 'EDAM Entertainment',
      debutYear: 2008,
      generation: 'Nation’s Soloist',
      fandomColor: '#34d399',
      fandomName: 'UAENA (유애나)',
      genres: ['Ballade', 'Indie-Pop', 'Folk', 'Acoustic'],
      bio: 'Die unangefochtene Solokünstlerin Südkoreas. Schreibt und komponiert ihre eigenen Alben („Through the Night“, „Palette“, „Love wins all“). Beherrscht akustischen Folk ebenso wie groß angelegte Pop-Epen.',
      members: null,
      associatedProducers: ['iu', 'prod-slom'],
      mbid: '8cb5cf6-60a6-4fba-bb8f-e14bfe39bf99',
      monthlyListeners: 8900000,
      totalScrobbles: 154000
    },
    {
      id: 'silica-gel',
      name: '실리카겔 Silica Gel',
      hangul: '실리카겔',
      romanized: 'Silrikagel',
      aliases: ['Silica Gel Band', 'Kim Han-joo'],
      type: 'group',
      agency: 'Magic Strawberry Sound',
      debutYear: 2015,
      generation: 'Indie / Neo-Psychedelic',
      fandomColor: '#38bdf8',
      fandomName: 'Gel Friends',
      genres: ['Indie', 'Psychedelic Rock', 'Math Rock', 'Experimental'],
      bio: 'Vierköpfige Band aus Seoul, die den Indie-Sound der 2020er revolutioniert hat. Mit komplexen Rhythmen, verzerrten Synthesizern und hypnotischen Visuals („NO PAIN“, „Tik Tak Tok“ feat. So!YoON!) gewannen sie dreimal hintereinander den KMA Best Modern Rock Song.',
      members: [
        { name: 'Kim Han-joo', hangul: '김한주', role: 'Keyboard, Vocal' },
        { name: 'Kim Choon-choo', hangul: '김춘추', role: 'Guitar, Vocal' },
        { name: 'Kim Geon-jae', hangul: '김건재', role: 'Drums' },
        { name: 'Choi Woong-hee', hangul: '최웅희', role: 'Bass' }
      ],
      associatedProducers: ['silica-gel'],
      mbid: '71c841bb-1092-4866-9b88-c7eec9b1e704',
      monthlyListeners: 510000,
      totalScrobbles: 38200
    }
  ],

  producers: [
    {
      id: 'prod-slom',
      name: 'Slom',
      hangul: '슬롬',
      romanized: 'Seullom',
      realName: 'Kim Min-woo (김민우)',
      agency: 'Standard Friends / AP Alchemy',
      genres: ['R&B', 'Neo-Soul', 'Lo-Fi', 'Hiphop'],
      roles: ['Produced', 'Arranged', 'Written'],
      creditsCount: 84,
      totalScrobbles: 21400,
      bio: 'Grammy-gefeierter Produzent und Beatmaker, bekannt für warme Fender-Rhodes-Chords, laid-back Dilla-Grooves und organische Basslines. Schrieb Musikgeschichte mit SUMIN („MINISERIES“), Zion.T („DIP“), pH-1, Lee Hi und als Siegerproduzent bei Show Me The Money 10 & 11.',
      keyWorks: ['Your Home (SUMIN & Slom)', 'THE GREATEST (Zion.T)', 'HOLO (Lee Hi Prod. Session)', 'Merry-Go-Round (sokodomo feat. Zion.T, Wonstein)'],
      collaborators: ['sumin', 'crush', 'lee-hi', 'ph-1']
    },
    {
      id: 'prod-250',
      name: '250',
      hangul: '이오공',
      romanized: 'I-o-gong',
      realName: 'Lee Ho-hyung (이호형)',
      agency: 'BANA (Beasts And Natives Alike)',
      genres: ['Electronic', 'Trot-Futurism', 'Pop', 'R&B'],
      roles: ['Produced', 'Arranged'],
      creditsCount: 42,
      totalScrobbles: 15980,
      bio: 'Produzent und Sounddesigner unter BANA. Entwickelte den bahnbrechenden, reduzierten Signature-Sound für NewJeans („Attention“, „Hype Boy“, „Ditto“, „ETA“). Sein von der Kritik gefeiertes Soloalbum „PPONG (뽕)“ dekonstruierte koreanische Trot-Nostalgie zu futuristischer elektronischer Kunstmusik und gewann vier KMAs.',
      keyWorks: ['Ditto (NewJeans)', 'Hype Boy (NewJeans)', 'Attention (NewJeans)', 'Bang Bus (250)'],
      collaborators: ['newjeans', 'prod-frnk']
    },
    {
      id: 'prod-frnk',
      name: 'FRNK',
      hangul: '프랭크',
      romanized: 'Peuraengkeu',
      realName: 'Park Jin-soo (박진수)',
      agency: 'BANA',
      genres: ['Jersey Club', 'Hip Hop', 'Experimental Electronic'],
      roles: ['Produced', 'Written'],
      creditsCount: 46,
      totalScrobbles: 7702,
      bio: 'Hälfte des legendären Underground-Hiphop-Duos XXX (mit Rapper Kim Ximya). Berühmt für rhythmisch komplexe Polyrhythmen, raue Breaks und unberechenbare Songstrukturen. Verantwortlich für NewJeans-Megahits wie „OMG“ und „Cookie“.',
      keyWorks: ['OMG (NewJeans)', 'Cookie (NewJeans)', 'Cool With You (NewJeans)', 'Language (XXX)'],
      collaborators: ['newjeans', 'prod-250']
    },
    {
      id: 'prod-gray',
      name: 'GRAY',
      hangul: '그레이',
      romanized: 'Geure-i',
      realName: 'Lee Sung-hwa (이성화)',
      agency: 'duover / AOMG (vormals)',
      genres: ['Hiphop', 'Trap', 'Contemporary R&B', 'Pop'],
      roles: ['Produced', 'Written', 'Arranged', 'Featured'],
      creditsCount: 112,
      totalScrobbles: 18220,
      bio: 'Mit seinem ikonischen Producer-Tag „GRAY“ definierte er über ein Jahrzehnt den Sound des koreanischen Hiphop und R&B bei AOMG. Schrieb endlose Nummer-1-Hits für Loco, Simon Dominic, Woo Won-jae („We Are“), Jay Park und Lee Hi.',
      keyWorks: ['We Are (Woo Won-jae feat. Loco, GRAY)', 'Hold Me Tight (Loco)', 'Drive (Jay Park)', 'Party (Shut Down)'],
      collaborators: ['lee-hi', 'ph-1', 'dynamic-duo', 'crush']
    },
    {
      id: 'prod-chacha',
      name: 'Cha Cha Malone',
      hangul: '차차 말론',
      romanized: 'Cha Cha Mallon',
      realName: 'Chase Vincent Malone',
      agency: 'AOMG / H1GHR MUSIC',
      genres: ['R&B', 'West Coast Rap', 'K-Pop'],
      roles: ['Produced', 'Arranged'],
      creditsCount: 58,
      totalScrobbles: 9140,
      bio: 'US-Produzent aus Seattle mit dem berühmten Tag „I Need a Cha Cha Beat Boy“. Zusammen mit Jay Park baute er AOMG und H1GHR MUSIC auf. Produzierte Hits für Jay Park („Joah“, „All I Wanna Do“), Red Velvet („Look“) und Baekhyun.',
      keyWorks: ['Joah (Jay Park)', 'All I Wanna Do (Jay Park)', 'Look (Red Velvet)', 'I Like 2 Party'],
      collaborators: ['ph-1', 'crush']
    },
    {
      id: 'prod-groovyroom',
      name: 'GroovyRoom',
      hangul: '그루비룸',
      romanized: 'Geurubirum',
      realName: 'Park Gyu-jeong & Lee Hwi-min',
      agency: 'AT AREA / H1GHR MUSIC',
      genres: ['Trap', 'Future Bass', 'Pop Rap'],
      roles: ['Produced', 'Arranged'],
      creditsCount: 96,
      totalScrobbles: 12450,
      bio: 'Das dynamische Produzenten-Duo („Groovy Everywhere“) gewann mehrfach den Producer of the Year Award bei den Korean Hip-hop Awards. Gründeten ihr eigenes Label AT AREA (Mirani, GEMINI, Dawn).',
      keyWorks: ['Sunday (Heize feat. Jay Park)', 'VVS (Mirani, Munchman, Khundi Panda)', 'Blue Moon (Hyolyn x Changmo)'],
      collaborators: ['ph-1', 'bibi']
    }
  ],

  songs: [
    {
      id: 'track-ditto',
      title: 'Ditto',
      hangulTitle: '디토',
      artistId: 'newjeans',
      artistName: 'NewJeans',
      album: 'OMG (Single)',
      releaseYear: 2022,
      releaseDate: '2022-12-19',
      duration: '3:05',
      genres: ['Idol', 'Baltimore Club', 'Pop'],
      generation: '4th Gen',
      isrc: 'KRA382201948',
      mbid: 'c52e89d1-382a-43d8-b57f-d169f4469738',
      credits: {
        performer: 'NewJeans (뉴진스)',
        producers: ['250 (이호형)'],
        composers: ['250', 'Ylva Dimberg'],
        arrangers: ['250'],
        lyricists: ['Minji (민지)', 'Ylva Dimberg', 'OOHYO', 'The Black Skirts (조휴일)']
      },
      plays: 12840,
      rankDelta: 2,
      youtubeId: 'pSUydWEqKwE',
      links: {
        spotify: 'https://open.spotify.com/track/3r8RuvgbX9b7AmfZ0DpjNV',
        apple: 'https://music.apple.com/album/ditto/1660601248',
        youtubeMusic: 'https://music.youtube.com/watch?v=pSUydWEqKwE',
        melon: 'https://www.melon.com/song/detail.htm?songId=35945920'
      }
    },
    {
      id: 'track-bamyanggaeng',
      title: 'Bam Yanggaeng',
      hangulTitle: '밤양갱',
      artistId: 'bibi',
      artistName: 'BIBI',
      album: '밤양갱 (Single)',
      releaseYear: 2024,
      releaseDate: '2024-02-13',
      duration: '2:26',
      genres: ['Indie', 'Waltz', 'Pop'],
      generation: 'Solo / R&B',
      isrc: 'KRB432400012',
      mbid: '49e2954a-7182-411a-b6e9-277dca714092',
      credits: {
        performer: 'BIBI (비비)',
        producers: ['Jang Ki-ha (장기하)'],
        composers: ['Jang Ki-ha'],
        arrangers: ['Jang Ki-ha'],
        lyricists: ['Jang Ki-ha']
      },
      plays: 11602,
      rankDelta: -1,
      youtubeId: 'sMdWRe6K7p8',
      links: {
        spotify: 'https://open.spotify.com/track/1P6M260y8G5kPqC5i7p2B4',
        apple: 'https://music.apple.com/album/bam-yang-gang-single/1729606830',
        youtubeMusic: 'https://music.youtube.com/watch?v=sMdWRe6K7p8',
        melon: 'https://www.melon.com/song/detail.htm?songId=37213898'
      }
    },
    {
      id: 'track-your-home',
      title: 'Your Home',
      hangulTitle: '너네 집',
      artistId: 'sumin',
      artistName: 'SUMIN & Slom',
      album: 'MINISERIES',
      releaseYear: 2021,
      releaseDate: '2021-09-15',
      duration: '3:18',
      genres: ['R&B', 'Neo-Soul', 'Indie'],
      generation: 'R&B Collab',
      isrc: 'KRC122100841',
      mbid: 'a3819d94-a128-4444-9388-c71c4c3e8009',
      credits: {
        performer: 'SUMIN (수민), Slom (슬롬)',
        producers: ['Slom', 'SUMIN'],
        composers: ['SUMIN', 'Slom'],
        arrangers: ['Slom'],
        lyricists: ['SUMIN']
      },
      plays: 9877,
      rankDelta: 4,
      youtubeId: 'lZ75h0u_M4g',
      links: {
        spotify: 'https://open.spotify.com/track/7i7z4sBw4yB5L3Q6jD1Z8q',
        apple: 'https://music.apple.com/album/miniseries/1585294511',
        youtubeMusic: 'https://music.youtube.com/watch?v=lZ75h0u_M4g',
        melon: 'https://www.melon.com/song/detail.htm?songId=33967812',
        bandcamp: 'https://suminslom.bandcamp.com'
      }
    },
    {
      id: 'track-antifreeze',
      title: 'Antifreeze',
      hangulTitle: '안티프리즈',
      artistId: 'black-skirts',
      artistName: '검정치마 The Black Skirts',
      album: '201',
      releaseYear: 2008,
      releaseDate: '2008-11-13',
      duration: '4:04',
      genres: ['Indie', 'Rock', 'Dream Pop'],
      generation: 'Indie Classic',
      isrc: 'KRA020800102',
      mbid: '9211a774-7221-4f1c-99d8-c71b6910a37e',
      credits: {
        performer: '검정치마 (The Black Skirts)',
        producers: ['Jo Hyu-il (조휴일)'],
        composers: ['Jo Hyu-il'],
        arrangers: ['Jo Hyu-il'],
        lyricists: ['Jo Hyu-il']
      },
      plays: 8410,
      rankDelta: 0,
      youtubeId: 'qQ99R2G3wSg',
      links: {
        spotify: 'https://open.spotify.com/track/25Qn8X1u4M7g1wX8',
        apple: 'https://music.apple.com/album/201/359218491',
        youtubeMusic: 'https://music.youtube.com/watch?v=qQ99R2G3wSg',
        melon: 'https://www.melon.com/song/detail.htm?songId=2021008'
      }
    },
    {
      id: 'track-tomboy',
      title: 'TOMBOY',
      hangulTitle: '톰보이',
      artistId: 'gidle',
      artistName: '(여자)아이들 (G)I-DLE',
      album: 'I NEVER DIE',
      releaseYear: 2022,
      releaseDate: '2022-03-14',
      duration: '2:54',
      genres: ['Idol', 'Alt-Rock', 'Pop Punk'],
      generation: '4th Gen',
      isrc: 'KRA382200318',
      mbid: '39a9c402-18da-4392-aa2e-4b2049c39fa4',
      credits: {
        performer: '(여자)아이들 ((G)I-DLE)',
        producers: ['Soyeon (전소연)', 'Pop Time', 'Daily'],
        composers: ['Soyeon', 'Pop Time', 'Daily'],
        arrangers: ['Pop Time', 'Daily', 'Soyeon'],
        lyricists: ['Soyeon']
      },
      plays: 7995,
      rankDelta: -2,
      youtubeId: 'Jh4QFaPmdss',
      links: {
        spotify: 'https://open.spotify.com/track/30ghGegx59yI2eTq4P3',
        apple: 'https://music.apple.com/album/i-never-die/1612739343',
        youtubeMusic: 'https://music.youtube.com/watch?v=Jh4QFaPmdss',
        melon: 'https://www.melon.com/song/detail.htm?songId=34752700'
      }
    },
    {
      id: 'track-event-horizon',
      title: 'Event Horizon',
      hangulTitle: '사건의 지평선',
      artistId: 'younha',
      artistName: '윤하 YOUNHA',
      album: 'END THEORY: Final Edition',
      releaseYear: 2022,
      releaseDate: '2022-03-30',
      duration: '5:00',
      genres: ['Ballade', 'Pop-Rock', 'Piano Rock'],
      generation: '2nd Gen',
      isrc: 'KRA492200192',
      mbid: '1e194830-4e89-43c2-bf72-e5b3810f4439',
      credits: {
        performer: '윤하 (YOUNHA)',
        producers: ['YOUNHA', 'JEWNO'],
        composers: ['YOUNHA', 'JEWNO'],
        arrangers: ['JEWNO'],
        lyricists: ['YOUNHA']
      },
      plays: 7233,
      rankDelta: 1,
      youtubeId: 'Bb3vy394yT4',
      links: {
        spotify: 'https://open.spotify.com/track/6p5qR1Zg4vF8',
        apple: 'https://music.apple.com/album/end-theory-final-edition/1616428314',
        youtubeMusic: 'https://music.youtube.com/watch?v=Bb3vy394yT4',
        melon: 'https://www.melon.com/song/detail.htm?songId=34819473'
      }
    },
    {
      id: 'track-rush-hour',
      title: 'Rush Hour',
      hangulTitle: '러쉬 아워',
      artistId: 'crush',
      artistName: 'Crush feat. j-hope',
      album: 'Rush Hour (Single)',
      releaseYear: 2022,
      releaseDate: '2022-09-22',
      duration: '2:57',
      genres: ['R&B', 'Funk', 'Hiphop'],
      generation: '3rd Gen',
      isrc: 'KRC122200844',
      mbid: '7192cb91-9e20-4ea2-8d77-62e92c4b8192',
      credits: {
        performer: 'Crush (크러쉬) feat. j-hope of BTS',
        producers: ['Hong So-jin', 'Crush'],
        composers: ['Crush', 'Hong So-jin'],
        arrangers: ['Hong So-jin'],
        lyricists: ['Crush', 'j-hope', 'PENOMECO']
      },
      plays: 6104,
      rankDelta: null,
      youtubeId: '2e-5O3F_oMo',
      links: {
        spotify: 'https://open.spotify.com/track/4W82F818cO8k',
        apple: 'https://music.apple.com/album/rush-hour-feat-j-hope-of-bts-single/1645511019',
        youtubeMusic: 'https://music.youtube.com/watch?v=2e-5O3F_oMo',
        melon: 'https://www.melon.com/song/detail.htm?songId=35658428'
      }
    },
    {
      id: 'track-through-the-night',
      title: 'Through the Night',
      hangulTitle: '밤편지',
      artistId: 'iu',
      artistName: '아이유 IU',
      album: 'Palette',
      releaseYear: 2017,
      releaseDate: '2017-03-24',
      duration: '4:13',
      genres: ['Ballade', 'Acoustic', 'Folk'],
      generation: 'Indie / Folk Pop',
      isrc: 'KRA381700412',
      mbid: '50e182cb-4899-4c81-8b22-8c7041a91e02',
      credits: {
        performer: '아이유 (IU)',
        producers: ['Kim Je-hwi', 'Kim Hee-won'],
        composers: ['Kim Je-hwi', 'Kim Hee-won'],
        arrangers: ['Kim Je-hwi', 'Kim Hee-won'],
        lyricists: ['IU (아이유)']
      },
      plays: 5877,
      rankDelta: -3,
      youtubeId: 'BzYnNdJhZQw',
      links: {
        spotify: 'https://open.spotify.com/track/30cQ7iU062m',
        apple: 'https://music.apple.com/album/palette/1228784112',
        youtubeMusic: 'https://music.youtube.com/watch?v=BzYnNdJhZQw',
        melon: 'https://www.melon.com/song/detail.htm?songId=30310140'
      }
    },
    {
      id: 'track-guilty',
      title: 'Guilty',
      hangulTitle: '죽일 놈',
      artistId: 'dynamic-duo',
      artistName: '다이나믹 듀오 Dynamic Duo',
      album: 'Band of Dynamic Brothers',
      releaseYear: 2009,
      releaseDate: '2009-10-07',
      duration: '3:45',
      genres: ['Hiphop', 'Soul Rap'],
      generation: 'Hiphop Classic',
      isrc: 'KRA020900389',
      mbid: '8cb92711-4a92-4211-9fa1-92b8109ca411',
      credits: {
        performer: '다이나믹 듀오 (Dynamic Duo)',
        producers: ['Dynamic Duo'],
        composers: ['Gaeko', 'Primary'],
        arrangers: ['Primary'],
        lyricists: ['Gaeko', 'Choiza']
      },
      plays: 4990,
      rankDelta: 6,
      youtubeId: 'T8z16A_R2n0',
      links: {
        spotify: 'https://open.spotify.com/track/109c1Z748u4A',
        apple: 'https://music.apple.com/album/band-of-dynamic-brothers/335359281',
        youtubeMusic: 'https://music.youtube.com/watch?v=T8z16A_R2n0',
        melon: 'https://www.melon.com/song/detail.htm?songId=2377853'
      }
    },
    {
      id: 'track-tik-tak-tok',
      title: 'Tik Tak Tok',
      hangulTitle: '틱택톡',
      artistId: 'silica-gel',
      artistName: '실리카겔 Silica Gel feat. So!YoON!',
      album: 'POWER ANDRE 99',
      releaseYear: 2023,
      releaseDate: '2023-08-19',
      duration: '4:22',
      genres: ['Indie', 'Psychedelic Rock', 'Math Rock'],
      generation: 'Indie / Alt-Rock',
      isrc: 'KRC122300910',
      mbid: '711829cb-1290-4822-9011-827b9a10fc21',
      credits: {
        performer: '실리카겔 (Silica Gel) feat. So!YoON! (황소윤)',
        producers: ['Silica Gel'],
        composers: ['Kim Han-joo', 'So!YoON!'],
        arrangers: ['Silica Gel'],
        lyricists: ['Kim Han-joo', 'So!YoON!']
      },
      plays: 4520,
      rankDelta: 3,
      youtubeId: 'eQ52W2qL78M',
      links: {
        spotify: 'https://open.spotify.com/track/38472910c283',
        apple: 'https://music.apple.com/album/power-andre-99/1718294102',
        youtubeMusic: 'https://music.youtube.com/watch?v=eQ52W2qL78M',
        melon: 'https://www.melon.com/song/detail.htm?songId=36712903',
        bandcamp: 'https://silicagel.bandcamp.com'
      }
    },
    {
      id: 'track-nerdy-love',
      title: 'Nerdy Love',
      hangulTitle: '널디 러브',
      artistId: 'ph-1',
      artistName: 'pH-1 feat. 백예린 (Yerin Baek)',
      album: 'Nerdy Love (Single)',
      releaseYear: 2020,
      releaseDate: '2020-01-09',
      duration: '3:20',
      genres: ['Hiphop', 'Melodic Rap', 'R&B'],
      generation: 'Hiphop / R&B',
      isrc: 'KRC122000018',
      mbid: '209381c8-8922-4820-9cb1-82910acb4920',
      credits: {
        performer: 'pH-1 feat. 백예린 (Yerin Baek)',
        producers: ['Mokyo'],
        composers: ['Mokyo', 'pH-1', 'Yerin Baek'],
        arrangers: ['Mokyo'],
        lyricists: ['pH-1', 'Yerin Baek']
      },
      plays: 3766,
      rankDelta: -2,
      youtubeId: 'vE5_r2P2f10',
      links: {
        spotify: 'https://open.spotify.com/track/93847291028',
        apple: 'https://music.apple.com/album/nerdy-love-single/1494291823',
        youtubeMusic: 'https://music.youtube.com/watch?v=vE5_r2P2f10',
        melon: 'https://www.melon.com/song/detail.htm?songId=32298711'
      }
    },
    {
      id: 'track-supernova',
      title: 'Supernova',
      hangulTitle: '슈퍼노바',
      artistId: 'aespa',
      artistName: 'aespa',
      album: 'Armageddon - The 1st Album',
      releaseYear: 2024,
      releaseDate: '2024-05-13',
      duration: '2:58',
      genres: ['Idol', 'Hyperpop', 'Dance'],
      generation: '4th Gen',
      isrc: 'KRA382400491',
      mbid: '928371cc-8299-4c12-8711-2093841029ba',
      credits: {
        performer: 'aespa (에스파)',
        producers: ['Dem Jointz', 'KENZIE'],
        composers: ['KENZIE', 'Dem Jointz', 'Paris Alexa'],
        arrangers: ['Dem Jointz'],
        lyricists: ['KENZIE']
      },
      plays: 13950,
      rankDelta: 1,
      youtubeId: 'phuiAIQAxZg',
      links: {
        spotify: 'https://open.spotify.com/track/7i7bB3278912',
        apple: 'https://music.apple.com/album/armageddon-the-1st-album/1744291048',
        youtubeMusic: 'https://music.youtube.com/watch?v=phuiAIQAxZg',
        melon: 'https://www.melon.com/song/detail.htm?songId=37521890'
      }
    }
  ],

  comebacks: [
    {
      id: 'cb-01',
      act: 'NewJeans',
      actHangul: '뉴진스',
      title: 'Supernatural (KR Extended Edition)',
      date: '2026-09-08',
      type: 'Single Album',
      genres: ['Idol', 'Pop', 'New Jack Swing'],
      status: 'Teaser Dropped',
      pipelineStep: 3, // 1: Announced, 2: Concept Photos, 3: MV Teaser, 4: Out Now
      teaserUrl: 'https://youtube.com',
      description: 'Erweiterte koreanische Version mit zwei unreleased B-Sides. Produziert von 250 und Ylva Dimberg.',
      isTracked: false
    },
    {
      id: 'cb-02',
      act: '검정치마 The Black Skirts',
      actHangul: '검정치마',
      title: 'Teen Troubles Epilogue',
      date: '2026-09-12',
      type: 'EP',
      genres: ['Indie', 'Rock', 'Dream Pop'],
      status: 'Announced',
      pipelineStep: 2,
      teaserUrl: 'https://youtube.com',
      description: 'Jo Hyu-il schließt die Teen-Troubles-Ära mit vier neuen Tracks ab. Limitierte 10"-Vinyl angekündigt.',
      isTracked: true
    },
    {
      id: 'cb-03',
      act: 'SUMIN & Slom',
      actHangul: '수민 & 슬롬',
      title: 'MINISERIES 2',
      date: '2026-09-18',
      type: 'Full Album',
      genres: ['R&B', 'Neo-Soul', 'Electronic'],
      status: 'MV Teaser',
      pipelineStep: 3,
      teaserUrl: 'https://youtube.com',
      description: 'Der lang erwartete Nachfolger des Kult-Albums. 10 neue Tracks, Features von Zion.T und 이하이 (Lee Hi).',
      isTracked: true
    },
    {
      id: 'cb-04',
      act: '(여자)아이들 (G)I-DLE',
      actHangul: '(여자)아이들',
      title: 'We Are Free',
      date: '2026-09-22',
      type: 'Mini-Album',
      genres: ['Idol', 'Alt-Rock', 'Hip Hop'],
      status: 'Announced',
      pipelineStep: 1,
      teaserUrl: 'https://youtube.com',
      description: 'Vollständig produziert von Jeon Soyeon und Minnie. Neues visuelles Konzept in Schwarz-Silber.',
      isTracked: false
    },
    {
      id: 'cb-05',
      act: '실리카겔 Silica Gel',
      actHangul: '실리카겔',
      title: 'Machine Heart',
      date: '2026-09-26',
      type: 'Single',
      genres: ['Indie', 'Math Rock', 'Experimental'],
      status: 'Teaser Dropped',
      pipelineStep: 2,
      teaserUrl: 'https://youtube.com',
      description: 'Neuer Song vor der anstehenden Asien-Tournee. Aufgenommen in den Wave Studios Seoul.',
      isTracked: false
    },
    {
      id: 'cb-06',
      act: 'Crush',
      actHangul: '크러쉬',
      title: 'Seoul City Grooves',
      date: '2026-09-30',
      type: 'Studio Album',
      genres: ['R&B', 'Soul', 'Funk'],
      status: 'Announced',
      pipelineStep: 1,
      teaserUrl: 'https://youtube.com',
      description: 'Doppelalbum mit 16 Tracks, darunter Big-Band-Arrangements und Street-Soul.',
      isTracked: false
    },
    {
      id: 'cb-07',
      act: '윤하 YOUNHA',
      actHangul: '윤하',
      title: 'Aura',
      date: '2026-10-04',
      type: 'Repackage',
      genres: ['Ballade', 'Piano Rock'],
      status: 'Announced',
      pipelineStep: 1,
      teaserUrl: 'https://youtube.com',
      description: 'Akustik-Neuaufnahmen ihrer größten Klassiker mit 40-köpfigem Orchester.',
      isTracked: false
    },
    {
      id: 'cb-08',
      act: 'aespa',
      actHangul: '에스파',
      title: 'Whiplash',
      date: '2026-10-14',
      type: 'Mini-Album',
      genres: ['Idol', 'Hyperpop', 'Techno'],
      status: 'Announced',
      pipelineStep: 1,
      teaserUrl: 'https://youtube.com',
      description: 'Fünftes Mini-Album mit Dark-Techno-Einflüssen und futuristischer Ästhetik.',
      isTracked: false
    }
  ],

  riddles: [
    {
      id: 'riddle-today',
      dayNumber: 42,
      songId: 'track-ditto',
      hintYear: 2022,
      hintGenre: 'Baltimore Club · K-Pop Y2K',
      hintProducer: 'Produziert von 250 (Lee Ho-hyung)',
      hintLyricHangul: '„Stay in the middle, Like you a little, Don’t want no […]“',
      hintLyricTranslation: '„Bleib in der Mitte, mag dich ein wenig, will kein Rätselspiel…“',
      initialBlur: 24, // px blur
      coverPlaceholderGradient: 'linear-gradient(135deg, #1e3a8a, #38bdf8, #f43f5e)',
      targetTitle: 'Ditto',
      targetArtist: 'NewJeans'
    },
    {
      id: 'riddle-yesterday',
      dayNumber: 41,
      songId: 'track-bamyanggaeng',
      hintYear: 2024,
      hintGenre: 'Indie-Waltz · Chanson Pop',
      hintProducer: 'Geschrieben und arrangiert von Jang Ki-ha',
      hintLyricHangul: '„달디달고 달디달고 달디단 […]“',
      hintLyricTranslation: '„Süß, bittersüß und zuckersüßes Kastaniengelée…“',
      initialBlur: 24,
      coverPlaceholderGradient: 'linear-gradient(135deg, #78350f, #fbbf24, #f43f5e)',
      targetTitle: 'Bam Yanggaeng',
      targetArtist: 'BIBI'
    }
  ],

  demoPersonas: [
    {
      id: 'persona-indie',
      name: 'K-Indie Explorer (Hyun-woo)',
      description: 'Hört fast ausschließlich Underground, Rock und R&B aus Hongdae.',
      koreaShare: 78,
      koreaScrobbles: 6840,
      totalScrobbles: 8769,
      topKoreanGenres: [
        { label: 'Indie / Rock', pct: 44 },
        { label: 'R&B / Soul', pct: 32 },
        { label: 'Alternative Rap', pct: 16 },
        { label: 'Idol Pop', pct: 8 }
      ],
      topArtists: [
        { name: '검정치마 The Black Skirts', plays: 1840 },
        { name: '새소년 SE SO NEON', plays: 1320 },
        { name: 'SUMIN & Slom', plays: 1190 },
        { name: '실리카겔 Silica Gel', plays: 980 },
        { name: 'HYUKOH', plays: 720 }
      ]
    },
    {
      id: 'persona-idol',
      name: 'Multi-Stan Fan (Lena)',
      description: 'Verfolgt Comebacks von NewJeans, aespa, (G)I-DLE und Stray Kids.',
      koreaShare: 91,
      koreaScrobbles: 14200,
      totalScrobbles: 15604,
      topKoreanGenres: [
        { label: '4th/5th Gen Girlgroups', pct: 62 },
        { label: 'Boygroups', pct: 21 },
        { label: 'K-OST & Ballade', pct: 11 },
        { label: 'Indie', pct: 6 }
      ],
      topArtists: [
        { name: 'NewJeans', plays: 4890 },
        { name: 'aespa', plays: 3620 },
        { name: '(여자)아이들 (G)I-DLE', plays: 2780 },
        { name: 'LE SSERAFIM', plays: 1640 },
        { name: '아이유 IU', plays: 1270 }
      ]
    },
    {
      id: 'persona-rnb',
      name: 'Seoul R&B & Beat Fiend (Marcus)',
      description: 'Fokussiert auf Produzenten-Credits, Beatmaker und Kollabos.',
      koreaShare: 54,
      koreaScrobbles: 4120,
      totalScrobbles: 7630,
      topKoreanGenres: [
        { label: 'Contemporary R&B', pct: 48 },
        { label: 'KR-Hiphop & Trap', pct: 34 },
        { label: 'Neo-Soul / Jazz', pct: 18 }
      ],
      topArtists: [
        { name: 'SUMIN', plays: 1240 },
        { name: 'Crush', plays: 990 },
        { name: 'pH-1', plays: 810 },
        { name: '이하이 LEE HI', plays: 630 },
        { name: '다이나믹 듀오 Dynamic Duo', plays: 450 }
      ]
    },
    {
      id: 'persona-casual',
      name: 'Global Casual (Sophie)',
      description: 'Hört westlichen Pop und Indie, hat K-Pop über Playlists entdeckt.',
      koreaShare: 24,
      koreaScrobbles: 2100,
      totalScrobbles: 8750,
      topKoreanGenres: [
        { label: 'Viral K-Pop', pct: 68 },
        { label: 'K-Drama OST', pct: 24 },
        { label: 'Indie', pct: 8 }
      ],
      topArtists: [
        { name: 'NewJeans', plays: 920 },
        { name: 'BIBI', plays: 540 },
        { name: '아이유 IU', plays: 380 },
        { name: 'aespa', plays: 260 }
      ]
    }
  ]
};

// Seed metadata remains reference content; platform destinations use title searches
// until individual recording URLs have been verified.
BIAS_DATA.songs.forEach(song => {
  const query = encodeURIComponent(`${song.artistName} ${song.title}`);
  song.links.spotify = `https://open.spotify.com/search/${query}`;
  song.links.apple = `https://music.apple.com/search?term=${query}`;
  song.links.youtubeMusic = `https://music.youtube.com/search?q=${query}`;
  song.links.melon = `https://www.melon.com/search/total/index.htm?q=${query}`;
});

// Artist identities checked against MusicBrainz on 2026-09-06. Recording IDs remain unverified.
const VERIFIED_ARTIST_IDS = {
  "newjeans": "49204a7a-ed85-407a-828f-6fd46f1d8126",
  "sumin": "16f456c9-e23b-4675-ab6a-fd295712c256",
  "black-skirts": "a697464c-69b1-4bbc-88cc-570c025a25e5",
  "se-so-neon": "717d466b-36b8-4a43-86e9-e8b8c4a658d7",
  "gidle": "0068ae6c-7156-40f9-a81f-39294af6a549",
  "bibi": "21c93d2d-dc10-4f8f-ae91-7285eff37c2f",
  "aespa": "b51c672b-85e0-48fe-8648-470a2422229f",
  "younha": "5e3bc4c7-adbe-40e0-b56e-57d755908d52",
  "crush": "d663f95b-096e-419b-8b5d-f9e8b980ad2b",
  "ph-1": "aace796b-0569-49b6-a144-64ea24031962",
  "dynamic-duo": "9f92f1e5-7b25-4be2-ab61-76b6db556887",
  "lee-hi": "60c05c03-e33e-44a7-bef8-6fb245aaea51",
  "iu": "b9545342-1e6d-4dae-84ac-013374ad8d7c",
  "silica-gel": "2c8b5bb2-6110-488d-bc15-abb08379d3c6"
};
BIAS_DATA.artists.forEach(artist => { artist.mbid = VERIFIED_ARTIST_IDS[artist.id] || null; });

// Export for Node and Browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BIAS_DATA;
}
