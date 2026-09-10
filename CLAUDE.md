# Music Mind Reader — Game & Product Spec

## Hugmyndin í hnotskurn
Samkvæmisleikur fyrir hópa vina. Þátttakendur velja tónlistarflokk(a), skila inn lagi/lögum nafnlaust, hópurinn hlustar saman (í samkvæmi), giskar á hver á hvaða lag, og gefur lögunum einkunn. Stig eru reiknuð út frá réttum ágiskunum og einkunnum sem lögin fá. Kjarnaspurningin sem drífur leikinn: „Hversu vel þekkir þú tónlistarsmekk vina þinna — og hversu vel þekkja þeir þig?"

## Staða varðandi Spotify (mikilvægt)
Staðfest beint hjá Spotify (ágúst 2026):
- Spotify Developer Compliance Tips banna beinlínis notkun Spotify í leikjum eða spurningakeppnum ("Games or trivia quizzes... a 'name that tune' quiz would not be allowed").
- Spotify Design & Branding Guidelines banna samstarfsmerkingu ("Don't use the Spotify brand together with any other brand or in any co-branded communications").
- **Ákvörðun:** Fyrsta útgáfan notar EKKI Spotify API, playback, né merki á neinn hátt — ekki einu sinni til lagaleitar. Notendur skrifa lag/flytjanda handvirkt eða líma inn hlekk sem er einfaldur texti. Tónlistin er spiluð utan appsins (leikstjórinn spilar í Spotify/YouTube Music/Apple Music/hverju sem er).
- Nafnið "Music Mind Reader" er óhætt að nota að fullu. "Powered by Spotify" og lógó-notkun er EKKI leyfð nema formlegt samstarf náist síðar.
- Langtímamarkmið: sanna leikinn með notendum og virkni fyrst, leita svo eftir samstarfi við Spotify/Tidal með gögn í hendi. Virðistillagan fyrir þau: leikurinn eykur virkni, endurkomu og tónlistaruppgötvun hjá þeirra notendum, og gæti fært þeim nýja notendur í gegnum vinahópa.

## Leikflæði — 6 skjáir

**Mikilvæg regla:** Flokkarnir eru EKKI einstaklingsbundið val. Leikstjóri (eða hópurinn saman) ákveður 1–2 sameiginlega flokka fyrir ALLA áður en innsending hefst. Allir þátttakendur fá sömu flokkana og skila inn einu lagi fyrir hvern flokk. Dæmi: umferð 1 er "Guilty pleasure" fyrir allan hópinn, umferð 2 (ef valið) er "Lag sem ég hlustaði á 18 ára" fyrir allan hópinn.

1. **Create or Join Game** — Leikstjóri stofnar leik, aðrir ganga inn.
2. **Lobby** — QR-kóði birtist, vinir skanna og slá inn nafn. Leikstjóri velur hér 1–2 sameiginlega flokka fyrir umferðina/umferðirnar — allir sjá sömu flokkana.
3. **Skila lagi** — Hver þátttakandi skilar inn einu lagi fyrir HVERN af þeim sameiginlegu flokkum sem voru valdir (nafnlaust). Ef 2 flokkar voru valdir skilar hver spilari 2 lögum, einu í hvorn flokk.
4. **Now Playing** — Appið raðar laglistanum (blandað milli flokka eða flokkur fyrir flokk), leikstjóri spilar hvert lag utan appsins.
5. **Giska og gefa einkunn** — Á meðan/eftir hvert lag giska allir á eigandann og gefa einkunn (0–5).
6. **Results** — Eigendur afhjúpaðir, stig reiknuð, titlar veittir.

## Flokkar (dæmi — flokka í tvo hópa í UI: "Tegund" og "Um mig")
Leikstjóri velur 1–2 af þessum flokkum í Lobby-skjánum fyrir ALLAN hópinn — ekki einstaklingsbundið val.
**Tegund:** Rokk, Popp, Guilty pleasure, Lag fyrir ræktina, Lag fyrir lok kvöldsins, Besta íslenska lagið

**Um mig:** Lag sem kemur mér í stuð, Besta lag allra tíma, Lag sem ég hlustaði á 18 ára, Lag sem enginn býst við að ég fíli, Lag sem ég myndi velja í karaoke, Lag sem lýsir einhverjum öðrum í hópnum, My funeral song, Óþolandi gott lag

## Stigagjöf (samræmt)
- Rétt ágiskun á eiganda lags: **+3 stig**
- Eigandi fær MEÐALTAL (ekki summu) einkunna frá öðrum, á skalanum 0–5
- Bónus ef enginn giskar rétt á eigandann: **+2 stig**
- Bónus fyrir hæst metna lag umferðarinnar: **+2 stig**
- "Great Minds" bónus ef tveir eða fleiri velja sama lagið óháð hvor öðrum: **+1 stig** hvor
- Ekki hægt að giska á eða gefa einkunn fyrir eigið lag (sjálfgefið útilokað úr valmöguleikum)

## Titlar í restina
- Music Mind Reader — flestar réttar ágiskanir
- Best Taste — hæsta meðaleinkunn laga
- Master of Disguise — fæstir fundu lögin þín
- Most Predictable — allir fundu lögin þín
- Musical Criminal — lægsta einkunn kvöldsins

## Brúnatilvik — ákveðnar lausnir
- **Sama lag valið af tveimur:** leyft, ekki hindrað (val er blint/samtímis) → "Great Minds" bónus við afhjúpun.
- **Enginn skilar lagi í tæka tíð:** umferð heldur áfram, viðkomandi fær 0 stig fyrir þá umferð.
- **Hópstærð:** miðað við 4–10 spilara fyrir bestu upplifun.
- **Lengd leiks:** sjálfgefið EIN umferð (einn flokkur) = ~20–30 mín. "Extended Play" valkostur bætir við öðrum flokki fyrir þá sem vilja lengri leik.

## Tæknileg nálgun fyrir fyrstu útgáfu
- Einfalt vefapp (mobile-first), ekkert niðurhal — virkar í vafra á síma.
- Enginn Spotify/tónlistar-API í v1. Handvirk innslátur á lag/flytjanda eða hlekk sem texta.
- Kjarnaáskorunin er rauntímasamstilling milli síma (svipað og Kahoot/Jackbox arkitektúr): einn "leikstjóra"-skjár + símar sem tengjast með leikkóða/QR, líklega með websockets fyrir lifandi stöðu (lobby, hver er búinn að skila, núverandi umferð o.s.frv.).
- Fyrsta skref: static/frontend frumgerð með gervigögnum og 4 "leikmönnum" til að sannreyna leikjaflæðið, áður en alvöru fjölspilun (bakendi + websockets + gagnagrunnur) er byggð.

## Næstu skref
1. Byggja smellanlega frumgerð af 6 skjáunum með gervigögnum (engin raunveruleg fjölspilun ennþá).
2. Prófa leikjaflæðið með alvöru hópi (pappír/Figma eða frumgerðin sjálf).
3. Byggja raunverulega fjölspilun (bakendi, websockets, gagnagrunnur fyrir leiki/spilara/lög/stig).
4. Safna notkunargögnum (fjöldi leikja, endurkoma, meðaltími í leik).
5. Þegar traustur notendafjöldi/gögn liggja fyrir: hafa samband við Spotify/Tidal viðskiptaþróun með tilbúna vöru og gögn.

## Fjölspilun — Arkitektúr (viðbót við upprunalega spec)

### Ákvörðun
Netshýst lausn, EKKI staðarnet (local WiFi). Ástæða: gestir geta verið á farsímagögnum (5G/4G) í stað sama WiFi-nets, og staðarnets-lausn myndi bresta fyrir þá. Netshýst lausn virkar óháð network — WiFi eða farsímagögn, sama hvað.

### Tækni
- **Frontend**: sama Vite + React + TypeScript + Tailwind + Zustand grunnur og áður — engin ástæða til að endurskrifa það sem er þegar til.
- **Realtime bakendi**: Firebase Realtime Database (eða Supabase Realtime sem jafngildur valkostur). Ástæða: ELDIR er ekki þörf á að skrifa/hýsa eigin websocket-server — client SDK-ið talar beint við þjónustuna, og allar breytingar sem einn síma gerir birtast sjálfkrafa á öllum öðrum símum sem eru „subscribed" á sama leik.
- **Hýsing fyrir frontend**: Vercel eða Netlify — ókeypis, sjálfvirk dreifing beint úr git repo-inu sem er nú þegar til.
- **Gagnalíkan**: eitt tré `games/{roomCode}` í Firebase sem inniheldur: `players` (nafn + id hvers leikmanns), `phase` (lobby / submit / playing / guessing / results), `categories`, `submissions`, `guesses`, `ratings`. Allir símar sem hlusta á sama `roomCode` fá breytingar í rauntíma sjálfkrafa, engin handvirk endurhleðsla.
- **Auðkenni leikmanns**: engin innskráning eða reikningar. Bara nafn + slembinn client-ID sem er vistaður í `localStorage` símans, bundinn við þennan `roomCode`. Ef síminn missir samband og tengist aftur (t.d. lyftan, veikt merki), finnur hann sjálfan sig aftur í sama leik með sama ID.
- **Join-kóði**: 4-6 handahófskennd tákn (t.d. "BLUE7"), sýnt sem texti OG QR-kóði sem vísar beint í `https://<domain>/join/<roomCode>` — skönnun opnar join-skjáinn með kóðanum útfylltum sjálfkrafa.

### Hvað breytist í núverandi kóða
- `gameStore.ts` breytist úr „uppspretta sannleikans" (allt í client-minni) í „syncaðan spegil" af Firebase-gögnunum. Aðgerðir eins og að skila lagi, giska eða gefa einkunn verða núna skrif til Firebase í stað þess að breyta local state beint — breytingin birtist svo öllum símum um leið, þeirra á meðal þeim sem framkvæmdi hana.
- `PlayerSwitcher`-component (sem lét okkur prófa sem 4 mismunandi leikmenn á einum skjá) er ekki lengur þörf í alvöru fjölspilun — hver sími ER sinn eigin leikmaður núna. Hægt að halda honum til hliðar sem debug-tól fyrir þróun.
- Lobby-skjárinn fær núna ALVÖRU lista yfir hverjir eru komnir inn, uppfærður í rauntíma, í stað gervigagna.
- `scoring.ts` (allar fimm reglurnar) þarf ekki að breytast — sömu hreinu útreikningsfallin, keyrð á endanlegum gögnum úr Firebase þegar öll innsending er búin.

### Röð vinnu
1. Setja upp Firebase-verkefni (ókeypis) og bæta SDK við núverandi React-verkefni.
2. Skilgreina `games/{roomCode}` gagnalíkanið sem endurspeglar núverandi TypeScript-týpur (`Player`, `Song`, `Category`, `Guess`, `Round`).
3. Breyta `gameStore.ts` úr local-state í Firebase-syncað state.
4. Uppfæra Lobby-skjáinn til að sýna alvöru leikmenn sem ganga inn í rauntíma, með join-kóða + QR.
5. Deploya frontend á Vercel/Netlify svo hlekkurinn/QR-kóðinn virki fyrir alla gesti, óháð network.
6. Prófa með alvöru hópi þar sem sumir eru á WiFi og sumir á farsímagögnum samtímis, til að staðfesta að netshýsta lausnin virki fyrir öll tilvik.


## Viðvarandi lobby með uppsafnaðri stigagjöf (viðbót við CLAUDE.md)

### Vandamál sem leyst er
Núna endar leikur á að leysa upp herbergið — hópurinn þarf að stofna/joina nýtt lobby til að spila aftur saman, og stig byrja alltaf á núlli. Notendaábending (frá playtesti): hópurinn vill geta haldið áfram að spila fleiri umferðir í sama lobby-inu, með uppsafnaðri stigatölu sem safnast upp á milli umferða.

### Gagnalíkan
Bæta við `totalScore` (eða sambærilegu) fyrir hvern leikmann í `players/{playerId}` sem lifir áfram milli umferða — ólíkt umferðar-sértækum gögnum (`songs`, `guesses`, `ratings`, `songOrder`, `currentSongIndex`, `selectedCategoryIds`) sem núllstillast við hverja nýja umferð.

### Results-skjárinn
Tveir hnappar, í þessari röð:
1. **„Go to lobby"** (nýr, efri/aðal-hnappur) — bætir stigum þessarar umferðar við `totalScore` hvers leikmanns, núllstillir umferðargögnin, og fer með ALLA aftur í SAMA lobby (sama `roomCode`) — ekki nýtt herbergi.
2. **„Leave Game"** (sami hnappur og er nú þegar til, óbreyttur að staðsetningu/hegðun fyrir neðan) — fyrir þá sem vilja hætta alveg og leysa upp herbergið.

### Lobby-skjárinn
Sýnir „leaderboard" með uppsafnaðri stigatölu (`totalScore`) um leið og a.m.k. ein umferð er búin — falið í allra fyrstu umferð þar sem ekkert er til að sýna enn.

### Nýir leikmenn milli umferða
Leyft — ef einhver joinar eftir að fyrsta umferð er búin, byrjar hann á núlli í `totalScore` en sést strax á leaderboard-inu með hinum. Ef hópurinn vill alveg nýtt herbergi (t.d. fyrir annan/nýjan hóp), fara þeir bara í Home og stofna nýtt lobby eins og áður — það flæði er óbreytt.

### Óbreytt
Sjálf stigaútreikningsrökin í `scoring.ts` fyrir eina umferð breytast ekki — þetta er bara viðbótarlag sem safnar saman niðurstöðum margra umferða ofan á það sem er nú þegar til.



## Lagaspilun í appinu (viðbót við CLAUDE.md — næsta stóra skref EFTIR að fjölspilun er staðfest í loftinu)

### Vandamálið sem er verið að leysa
Núverandi flæði (leikstjóri spilar lögin utan appsins, t.d. í Spotify/YouTube Music) er tafsamt í framkvæmd: einn þarf að halda utan um playlist í öðru appi, allir þurfa að koma lögunum sínum til hans, og í hvert sinn sem lag klárast þarf hann að finna og velja næsta lag handvirkt í hinu appinu. Þetta er núningsflötur sem getur drepið stemninguna í samkvæminu.

### Ákvörðun
Bæta beinni lagaspilun við appið sjálft, í gegnum YouTube — EKKI Spotify (áfram bannað í leikjum, staðfest fyrr í þessu ferli) og EKKI Deezer (óljósir skilmálar fyrir leikjanotkun). YouTube leyfir innfellingu (embedding) þriðja aðila forrita samkvæmt þeirra eigin verktakareglum, en með skilyrðum.

### Skilyrði frá YouTube sem VERÐUR að fylgja
- Spilarinn verður að vera SÝNILEGUR á skjánum — má ekki fela hann eða spila bara hljóðið í bakgrunni.
- YouTube-uppruni verður að vera skýr fyrir notandanum (merki/branding sýnilegt).
- Ekki má taka hljóðið úr og einangra það frá myndbandinu — spilarinn verður að virka óbreyttur eins og YouTube hannaði hann.
- Engin sérstök takmörkun fannst á leikja-/spurningakeppna-notkun sjálfri (ólíkt Spotify).

Í praxís þýðir þetta: „Now Playing" skjárinn þarf að sýna alvöru YouTube-spilara (með myndbandi) í stað þess að vera bara texti/hljóð falið á bak við eigið útlit.

### Tæknilegar þarfir
- **YouTube Data API**: notað til að leita að og finna rétt myndbands-ID fyrir lagið sem einhver skrifar inn (t.d. „Master of Puppets — Metallica" → finnur samsvarandi YouTube video-ID). Þarf ókeypis Google Cloud-verkefni og API-lykil — svipað ferli og Firebase-uppsetningin sem þið eruð nú þegar vön.
- **YouTube IFrame Player API**: notað til að spila valda myndbandið beint í appinu, sýnilegt á skjánum.
- Söngvaleitin (MusicBrainz, sem áður var rædd fyrir autocomplete) og YouTube-leitin geta unnið saman: MusicBrainz gefur „rétt" nafn á lagi/flytjanda, YouTube-leitin finnur svo myndbands-ID til að spila.

### Hvað breytist í leikjaflæðinu
- Í stað þess að leikstjóri „finni og spili" hvert lag handvirkt utan appsins, spilar appið sjálft næsta lag sjálfkrafa þegar röðin kemur að því (nýtir sömu „phase"/röð-strúktúr og fjölspilunar-planið notar nú þegar fyrir `songOrder`/`currentSongIndex`).
- Allir sjá sama YouTube-spilarann samtímis (ekki bara leikstjórinn) — sem er í raun betri upplifun en núverandi fyrirkomulag þar sem bara leikstjórinn horfir á skjáinn sem spilar tónlistina.
- Handvirki textainnslátturinn helst sem öryggisnet: ef YouTube-leitin finnur ekkert samsvarandi myndband fyrir lagið sem einhver skrifaði inn, þarf notandinn samt að geta klárað innsendinguna (t.d. með því að líma inn beinan YouTube-hlekk sjálfur í staðinn).

### Röð — EKKI byrja fyrr en núverandi fjölspilunarvinna er staðfest í loftinu
1. Klára núverandi skref: öryggisreglur birtar, GitHub Secrets komin inn, deployað, prófað með alvöru hópi á mismunandi netum.
2. Stofna Google Cloud-verkefni + YouTube Data API lykil (þið gerið, svipað og Firebase-skrefin).
3. Bæta YouTube-leit við lagaskil-flæðið (finna video-ID við innsendingu eða þegar „Now Playing" hefst).
4. Skipta út „leikstjóri spilar utan appsins" fyrir alvöru IFrame-spilara á Now Playing-skjánum, tengdan við `songOrder`/`currentSongIndex`.
5. Handvirkt öryggisnet: leyfa beinan YouTube-hlekk sem varaleið ef sjálfvirk leit finnur ekki réttan hlut.
6. Prófa með alvöru hópi — staðfesta að sjálfvirk spilun/framvinda virki fyrir alla samtímis.

## Flæðandi lobby + dýnamísk stigagjöf (viðbót við CLAUDE.md)

### 1. Enginn fyrirfram valinn spilarafjöldi

Leikstjóri velur flokk(a) og fer beint inn í lobby-ið — ALDREI spurður hversu margir eigi að spila. Það er ekkert „slots"-hugtak.

- `players`-nóðan í Firebase er listi sem stækkar lífrænt eftir því sem fólk joinar. Hver nýr spilari = nýr lykill undir `players/{playerId}`, ekkert frátekið fyrirfram.
- Lobby-skjárinn sýnir bara þá sem eru komnir inn hverju sinni, uppfært í rauntíma.
- „Byrja leik" hnappurinn virkjast um leið og lágmarksfjöldi (t.d. 2+) er kominn inn. Leikstjóri má samt bíða lengur — 4–10 spilarar er kjörsvið fyrir upplifunina, ekki krafa.
- Join er opið hvenær sem er á meðan `phase === 'lobby'`. Um leið og `phase` fer í `submit` er lokað fyrir nýja spilara þar til næsta umferð (join milli umferða er þegar leyft, sjá viðvarandi-lobby-planið).

### 2. Einkunnaskalinn verður að vera dýnamískur, ekki fastur 0–10

Núverandi kerfi: hver giskandi úthlutar HVERJU lagi (nema sínu eigin) STAKRI einkunn — sama gildi má ekki nota tvisvar hjá sama giskanda. Þetta er í raun röðun/úthlutun stiga, ekki frjáls endurtekin einkunnagjöf.

Fastur skali 0–10 (11 gildi) dugði nákvæmlega fyrir allt að 12 spilara, af því hver giskar á 11 önnur lög. Skalinn á ALLTAF að vera a.m.k. 0–10 — hann stækkar bara ef leikmenn verða fleiri en 12.

**Formúla:**
```
hámarkseinkunn = max(10, N - 2)
```
þar sem `N` = fjöldi laga sem eru í spilun þessa umferð (lög sem raunverulega komust í spilun — ekki heildarfjöldi skráðra spilara, sjá brúnatilvikið um að skila ekki lagi í tæka tíð).

Dæmi:
| Lög í umferð (N) | Skali |
|---|---|
| 3 | 0–10 (lágmark) |
| 12 | 0–10 |
| 13 | 0–11 |
| 14 | 0–12 |

Reiknað í byrjun hverrar umferðar — ekki hardkódað gildi í kóðanum lengur.

### 3. Normalisering — ákveðið gegn (var íhugað, ekki útfært)

Í fyrstu var talið að af því skalinn getur verið mismunandi milli umferða (8 spiluðu → 0–6, 12 spiluðu → 0–10) þyrfti að normalisera hráar einkunnir (`einkunn / (N-2)`) áður en þær leggjast í `totalScore`, svo „besta frammistaða" væri alltaf jafn mikils virði.

**Ákvörðun:** ekki gera þetta. Leikjarökin, meðaltalsútreikningurinn og `totalScore`-uppsöfnunin breytast ekki neitt — hráa einkunnin (nú allt að `N-2`) flæðir í gegn nákvæmlega eins og `0–10` gerði. Eina sem raunverulega breytist er að nú er hægt að gefa hærri en 10 í stærri umferð, og það misræmi milli umferða er samþykkt sem nógu sanngjarnt. `scoring.ts` er því ósnert.


## Mjúk umskipting milli laga (viðbót við CLAUDE.md — hluti af lagaspilun í appinu)

Þegar skipt er úr einu lagi yfir í það næsta (t.d. þegar allir eru búnir að giska/gefa einkunn fyrir núverandi lag), á hljóðið að fjara út frekar en að stoppa/skipta harkalega — ekki harður "cut" á milli laga.

### Útfærsla
- Nota `player.setVolume(0–100)` úr YouTube IFrame Player API-inu — staðlað stýring sem spilarinn sjálfur býður upp á, ekki einangrun á hljóði frá myndbandi, svo þetta brýtur ekki YouTube-skilyrðin sem eru þegar skráð fyrir lagaspilunina.
- Keyra stutt interval sem lækkar hljóðstyrk skref fyrir skref (t.d. 100 → 0 á ~1–1.5 sek).
- Hlaða næsta lag inn (`loadVideoById`) þegar hljóðstyrkur er kominn í 0.
- Hækka hljóðstyrk aftur (fade-in) um leið og nýja lagið byrjar — gefur „crossfade"-tilfinningu í stað harkalegs skiptis.

### Sjónræn mýking (valfrjálst, til viðbótar)
IFrame API hefur enga innbyggða leið til að láta sjálft MYNDIÐ fjara út (bara hljóðið). Ef sjónræn mýking er líka æskileg: nota létt yfirlags-element (t.d. svartur `div` með `opacity`-transition) sem hylur spilarann rétt á meðan skiptingin á sér stað, samstillt við hljóðfade-ið — gefur „fade to black og til baka" tilfinningu.

### Staða
Útfært (`src/components/NowPlayingPlayer.tsx`): host-spilarinn notar núna YouTube IFrame Player API-ið í stað hrás `<iframe>` — hljóðið fjarar út (~0.9s), næsta lag hleðst inn með `loadVideoById`, og fjarar svo inn aftur, með svörtum yfirlags-`div` sem fylgir hljóðfade-inu. `unMute()` kallað (bæði beint og á `onStateChange` PLAYING) svo autoplay-stefna vafrans þaggi ekki niður í laginu sem er skipt inn.

Restin af „Lagaspilun í appinu" áfanganum (sjálfvirk framvinda milli laga o.fl.) er enn eftir.


## Lobby og Game Setup aðskilin (viðbót við CLAUDE.md)

Lobby-skjárinn gerði tvennt á einu korti: sýndi spilaralista OG lét host velja flokk. Þessu er skipt í tvo skjái / tvær phase-ir:

- **Lobby** (`phase: 'lobby'`, `02-Lobby.tsx`) — bara „eru allir komnir?": QR, game code, spilaralisti, „waiting for more players", og (frá 2. umferð) uppsöfnuð stigatafla. Host smellir á **„Set up round"**.
- **Game Setup** (`phase: 'setup'`, `02b-GameSetup.tsx`) — rúmgóður umferðar-stillingaskjár. Núna bara flokkavalið (`CategoryPicker`, syncað lifandi með `chooseCategories`), en lagt upp fyrir fleiri stillingar seinna (Extended Play, umferðarlengd). Host: „Start Submitting Songs" + „← Back to lobby". Aðrir: sjá valinn flokk lifandi + „host is setting up".

Nýjar store-aðgerðir: `startRoundSetup()` (lobby→setup), `backToLobby()` (setup→lobby, opnar join aftur). Join er áfram bara leyft í `phase === 'lobby'` — ef host er kominn í setup og einhvern vantar, fer host „← Back to lobby". Milli umferða: `finalizeRoundIfReady` → `phase: 'lobby'` (stigatafla), svo host í setup aftur.

Þar sem eldri kaflar segja „host velur flokk í Lobby" er átt við þennan Game Setup skjá núna.
