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

**Um mig:** Lag sem kemur mér í stuð, Besta lag allra tíma, Lag sem ég hlustaði á 18 ára, Lag sem enginn býst við að ég fíli, Lag sem ég myndi velja í karaoke, Lag sem lýsir einhverjum öðrum í hópnum, Óþolandi gott lag

Raunverulegi listinn (ensku, flatur — ekki grúppaður í UI-inu) er í `src/state/mockData.ts` (`CATEGORIES`).

**Endurskoðað 2026-09-17** (áður en einkalistar-fídusinn er byggður ofan á flokka-ID-in, sjá "Notendaaðgangur..." kaflann): fækkað úr 50 í 41 flokk. Tekið út: hreinar „hvað er uppáhalds/besta X-ið þitt" spurningar sem gáfu enga innsýn í manneskjuna (My All-Time Favourite, The Best Song From the 90s, My Favourite Song by a Solo Artist, o.fl.), og sameinuð pör sem spurðu í raun sömu spurningu tvisvar (t.d. „Wake Me From a Coma" inn í „Gets Me Going"/„Party Starter"). Nokkrir „favorite X" flokkar héldu sæti en fengu nýtt orðalag sem krefst skoðunar/andstæðu í staðinn fyrir flatt „uppáhalds" (sama trix og gerir „A Song Everyone Hates but I Love" áhugaverðan) — t.d. „My Favourite Song From a Movie" varð „A Song That's Better Than the Movie It's From".

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
- **Host-arftaki**: ef host (,,lobby master") leaves-ar leikinn (`leaveGame`, t.d. Home-takkinn í hamborgara-glugganum, EÐA „Leave Game" á Results) fær herbergið sjálfkrafa nýjan host — sá sem hefur verið lengst í `players`-listanum (fyrir utan þann sem er að fara), aldrei tilviljunarkennt val. Uppfærslan er EIN `update()`-köll svo herbergið er aldrei stundarkorn án host fyrir aðra spilara sem hlusta. Athugið: þetta grípur bara sjálfviljuga „leave" — ef host lokar bara flipanum/appinu án þess að ýta á neitt er ekkert „presence"-kerfi til að taka eftir því, svo `hostId` breytist ekki fyrr en einhver leaves-ar formlega.
- **„Leave" fjarlægir röðina úr `players` EINGÖNGU í allra fyrsta lobby-inu:** `leaveGame(removeFromRoom)` eyðir röðinni bara ef `removeFromRoom` OG `phase === 'lobby'` OG `roundsCompleted === 0`. Í öllum öðrum tilvikum (mið-umferð um Home-takkann, „Leave Game" á Results, EÐA — mikilvægt — Home-takkinn í lobby-inu Á MILLI umferða) er röðin skilin eftir og `lobbyReady/{id}: true` + `finalConfirmations/{id}: true` skrifað fyrir viðkomandi í staðinn. Ástæðurnar eru þrjár:
  1. Ef röðin er tekin úr `players` mið-umferð, festist hópurinn — hvorki `finalizeRoundIfReady` (bíður `lobbyReady` frá ÖLLUM `players`) né „See Results" (bíður `finalConfirmations`/`allConfirmed` frá ÖLLUM `players`) kemst nokkurn tímann áfram ef einhver sem er farinn er samt talinn með. Villan sem kom upp í alvöru: host fór úr leiknum á Results, hinir tveir ýttu á „Go to lobby" og sátu fastir á „Waiting for everyone to head back to the Lobby..." að eilífu.
  2. Röðin þarf að lifa áfram svo lagið/giskin/einkunnirnar sem eru geymd á sama `playerId` glatist ekki, og svo reconnect-með-nafni (næsta punktur) hafi eitthvað til að finna.
  3. **`totalScore` er geymt Á sömu röðinni** — svo eftir að a.m.k. ein umferð er búin (`roundsCompleted > 0`) þýðir „lobby" EKKI lengur „ekkert er í húfi hér". Villan sem kom upp: einhver leaves-aði á milli umferðar 3 og 4, `phase === 'lobby'` blekkti gömlu skilyrðin til að halda að það væri óhætt að eyða röðinni, og öll uppsöfnuðu stigin hans hurfu með henni — endurtenging bjó bara til nýjan spilara með 0 stig því ekkert var eftir til að finna.
  Bæði flögg (`lobbyReady`/`finalConfirmations`) núllstillast hvort sem er við næstu umferð (`finalizeRoundIfReady`), og að senda inn svar aftur eftir reconnect hreinsar `finalConfirmations` sjálfkrafa (sjá `submitGuess`/`submitRating`) — svo þetta getur aldrei falið alvöru ókláraða vinnu á bak við falska „confirmed" stöðu.
- **Reconnect með sama nafni** (`joinGame`): ef nafn sem einhver skrifar passar (case-insensitive) við núverandi spilara í `players`, er það meðhöndlað sem ENDURTENGING í stað þess að búa til nýjan spilara — sama `playerId` er tekið upp aftur (þeirra fyrra lag/gisk/einkunnir/`totalScore`, allt geymt á því ID-i, kemur með). Þetta gildir: ALLTAF þegar `phase !== 'lobby'` (umferð þegar hafin — þar getur nafnasamsvörun aldrei verið neitt annað en endurtenging, því glæný manneskja kemst ekki inn þá hvort eð er), OG í `phase === 'lobby'` EF `roundsCompleted > 0` (þ.e. herbergið er að byrja aðra umferð — nákvæmlega þegar „quiet"-leave að ofan getur skilið eftir stigaða röð sem einhver gengur svo aftur inn í). Í allra fyrsta lobby-inu (`roundsCompleted === 0`) er nafnasamsvörun EKKI virkjuð — tveir mismunandi vinir sem skrifa báðir „Alex" eiga að fá tvær aðskildar raðir, ekki eina umdeilda. Til viðbótar við `resumeSession()` (virkar bara ef `localStorage` lifir af — sama vafri/tæki), grípur þetta þegar einhver missir sambandið og þarf að byrja join-flæðið alveg upp á nýtt (nýtt tæki, hreinsað `localStorage`, Home-takkinn ýttur óvart, o.s.frv.). Engin „presence"-staðfesting er til að vita hvort upprunalega session-ið sé raunverulega farið — nafnasamsvörun er sami trausts-grunnur og room-kóðinn sjálfur byggir á (ekkert innskráningarkerfi til að byrja með), í lagi fyrir vinahóp, ekki öryggisvörn.
  - **Endurtenging á meðan enn er verið á Results má ekki hoppa fram hjá því:** `leaveGame` merkir þann sem fer sem `lobbyReady`/`finalConfirmations` (sjá að ofan) svo hann festi ekki hina — en það þýddi að endurtenging meðan `phase` er ennþá `'results'` lenti beint í Lobby (`usePhaseNavigation` túlkar `lobbyReady` sem „búinn að ýta á Go to lobby") og viðkomandi missti algjörlega af því að sjá stigatöfluna sína þessa umferð. Endurtenging hreinsar því núna `lobbyReady`/`finalConfirmations` fyrir sig aftur um leið og hún tekur upp gömlu röðina — skaðlaust þegar hvorugt flaggið skiptir máli (`phase` hvorki `'results'` né wrap-up), en tryggir að sá sem kemur til baka lendi á Results (eða confirm-skjánum) og fái sjálfur að staðfesta, ekki að vera talinn búinn án þess að hafa séð neitt.
- **Join-kóði**: 4-6 handahófskennd tákn (t.d. "BLUE7"), sýnt sem texti OG QR-kóði sem vísar beint í `https://<domain>/join/<roomCode>` — skönnun opnar join-skjáinn með kóðanum útfylltum sjálfkrafa. Auk þess: `RoomCodeBadge` (`src/components/RoomCodeBadge.tsx`) sýnir kóðann sem lítinn merkimiða efst hægra megin á ÖLLUM skjám (á móti hamborgara-takkanum) meðan `roomCode` er til — svo hann gleymist ekki þótt einhver fari óvart í Home og þurfi að reconnecta. Smellur á hann afritar kóðann (`navigator.clipboard`) og sýnir „Copied!" í 1,2 sek. Þess vegna nota Lobby og Results núna `pt-16` (eins og hinir skjáirnir) í stað `py-8` — annars skaraðist stóra „Music Mind Reader" fyrirsögnin við merkimiðann.

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

### Staða — útfært
Ábending úr playtesti: það fór í taugarnar á fólki að þurfa að bíða þangað til BÓKSTAFLEGA allir höfðu ýtt á „Go to Lobby" áður en NOKKUR sá uppfærða stigatölu — jafnvel sá sem var fyrstur að ýta sat og horfði á gömlu töluna þangað til sá síðasti loksins ýtti líka. Lagað með því að skilja að tvennt sem áður gerðist í einu skrefi (`finalizeRoundIfReady`, læst á að ALLIR séu tilbúnir):
- **`totalScore`-útreikningur og -skrif** (`applyRoundScoresIfNeeded` í `gameStore.ts`) gerist núna strax þegar FYRSTI leikmaðurinn ýtir á „Go to Lobby" (kallað úr `returnToLobby()`), varið af `roundScoresApplied` fána svo það gerist bara einu sinni sama hvort margir ýti nánast samtímis.
- **Sjálf umferðar-núllstillingin** (`songs`/`guesses`/`ratings`/`songOrder`/`phase`/`roundsCompleted++` o.s.frv.) bíður áfram þangað til ALLIR eru tilbúnir (`finalizeRoundIfReady`), enda þarf sá gögn að haldast óhreyfð fyrir þá sem eru ennþá að skoða Results-skjáinn. `applyRoundScoresIfNeeded` er kallað þar líka, en er þá bara „no-op ef þegar gert" varnarnet.

Niðurstaðan: sá sem ýtir fyrstur sér uppfærða heildarstigatölu sína um leið og hann lendir í lobby-inu, í stað þess að bíða eftir öllum hinum.

**Böggur sem kom upp í alvöru spilun (fannst og lagað sama kvöld):** einn spilari, Results sýndi „+5 stig" (enginn gat giskað á hann), en Lobby-inn rétt á eftir sýndi 0. Rótin: `finalizeRoundIfReady` kallaði `applyRoundScoresIfNeeded()` án þess að BÍÐA eftir henni áður en hún hélt áfram með sjálfa umferðar-núllstillinguna (`songs`/`guesses`/`ratings: null`). Með einum spilara (eða hvenær sem síðasti spilarinn til að ýta á „Go to Lobby" er sá sami og klárar „allir tilbúnir" skilyrðið) gerast bæði kallið úr `returnToLobby()` OG núllstillingin úr `finalizeRoundIfReady()` nánast samtímis á sama tæki — ef núllstillingin nær að skrifa `null` yfir umferðargögnin ÁÐUR en stigaútreikningurinn nær að lesa þau, reiknast allir með 0 stig og EKKERT skrifast (því `roundScore !== 0` skilyrðið sleppir núll-breytingum). Lagað: `finalizeRoundIfReady` er núna `async` og `await`-ar `applyRoundScoresIfNeeded()` (sem sjálf `await`-ar núna líka sína eigin `totalScore`-skrifun) áður en hún snertir umferðargögnin.



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
  - **Kvóti (raunverulegt vandamál, kom upp í alvöru spilun):** `search.list` kostar 100 einingar af 10.000/dag sjálfgefnum kvóta — bara **100 leitir á dag samtals fyrir allan hópinn**, sameiginlegt á einum lykli. Nokkrir spilarar sem leita 1-2x hver klára þetta auðveldlega á 2 umferðum. Þegar kvótinn klárast hættir leit að virka fyrir ALLA samtímis (deilt vandamál, ekki staðbundið).
  - Kóðinn (`src/logic/youtube.ts`) minnkar álagið sjálfkrafa: hver leit sækir núna 9 niðurstöður í EINNI köllun (YouTube rukkar sama verð óháð `maxResults`, allt að 50), og „Show next 3 results" opinberar bara meira af því sem er þegar sótt — engin ný köllun fyrr en allar 9 eru búnar. Það minnkar dæmigerða notkun um allt að 3x.
  - Villuboðin greina núna á milli „ekkert fannst" og „leitin er í raun biluð/kvóti búinn" (`error: 'quota' | 'other'` á `YouTubeSearchPage`) — notandinn sér „Song search has hit its limit for today" í stað villandi „Couldn't find a video for X".
  - **Deildur leitar-cache í Firebase** (`songSearchCache/{normaliseruð fyrirspurn}` í `src/logic/youtube.ts`): fyrsta síða hverrar leitar (þ.e. án `pageToken`) er vistuð þar (30 daga TTL) og LESIN ÞVERT Á ÖLL herbergi — ekki bara þitt eigið. Því vinsælli sem leikurinn verður, því fleiri hópar leita að sömu vinsælu lögunum, og því fleiri þeirra fá svar úr cache-inu ókeypis í stað þess að kosta kvóta aftur — þetta er lykilatriðið sem gerir kerfið SKALANLEGT, ekki bara sparar aðeins. Ef lifandi köllun mistekst (kvóti búinn) en gömul (jafnvel útrunnin) cache-færsla er til fyrir nákvæmlega sömu fyrirspurn, er hún notuð í staðinn fyrir að klikka alveg — einmitt þegar cache-ið skiptir mestu máli (undir álagi).
    - **KREFST BREYTINGAR Á FIREBASE-REGLUM (Realtime Database), UTAN KÓÐA:** staðfest með beinni prófun að núverandi reglur hafna `songSearchCache` (`permission_denied`) því þær ná bara yfir `games/*`. Cache-ið er þar til „off" í praxís (leitin virkar samt eðlilega, bara án cache-ávinnings) þangað til reglunum er breytt. Í Firebase Console → Realtime Database → Rules, bæta `songSearchCache` við sem systurgrein `games`-reglunnar, með sama aðgengi og hún er nú þegar með (ekkert auðkenningarkerfi er í appinu, svo `games` er líklega alveg opið):
      ```json
      "songSearchCache": {
        ".read": true,
        ".write": true
      }
      ```
      (passa að þetta sé INNAN `"rules": { ... }` hlutans, við hliðina á núverandi `"games"` grein — ekki í staðinn fyrir hana.)
  - **ÞARF SAMT AÐGERÐ UTAN KÓÐA — hærri kvóti:** cache-ið og batching-ið hér að ofan STRETCHA sama kvótann lengra, en búa ekki til meiri kvóta. Ef leikurinn verður vinsæll þarf raunverulega hærri dagskvóta hjá Google:
    1. Google Cloud Console (console.cloud.google.com) → veldu rétta verkefnið (sama og YouTube API lykillinn tilheyrir).
    2. APIs & Services → Enabled APIs → „YouTube Data API v3" → flipinn „Quotas & System Limits" (eða beint: APIs & Services → Quotas, sía á „YouTube Data API v3").
    3. Finna „Queries per day" — smella á reitinn, „EDIT QUOTAS" (eða „Request higher quota" hnappur).
    4. Fylla út eyðublaðið: lýsa appinu stuttlega (samkvæmisleikur, party-app, hversu margar fyrirspurnir er ætlast til á dag) og hversu háan kvóta er beðið um — t.d. 50.000-100.000 einingar/dag (500-1000 leitir/dag) er hófleg byrjunarbeiðni.
    5. Google svarar yfirleitt á nokkrum dögum. Ekki víst að beiðnin sé samþykkt að fullu, en oft fæst einhver hækkun fyrir lögmæt lítil verkefni.
    - Ódýrari millileikur ef bið eftir svari er löng: nýtt, ALVEG SÉRSTAKT Google Cloud-verkefni (með sínum eigin YouTube API-lykli) fær sinn eigin sjálfstæða 10.000/dag kvóta — ekki „svindl" af hálfu Google (hvert verkefni fær frían grunnkvóta), en krefst þess að skipta um lykil í GitHub Secrets ef/þegar núverandi klárast, sem er handavinna, ekki sjálfvirk lausn.
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
Útfært (`src/components/NowPlayingPlayer.tsx`): spilarinn notar YouTube IFrame Player API-ið í stað hrás `<iframe>` — hljóðið fjarar út (~0.9s), næsta lag hleðst inn með `loadVideoById`, svartur yfirlags-`div` hylur skiptinguna.

**Allir fá spilarann + myndbandið** (ekki bara host) svo fólk sem spilar fjarri (erlendis, annarsstaðar á landinu, kemst ekki í partýið) getur fylgst með. Bara spilari host-tækisins:
- keyrir hópframvindu (`onCap`/`onEnded` → `doAdvance`) — í `05-GuessAndRate.tsx` eru þessi callback + `capSeconds` gefin `null`/no-op nema `isHost`, svo einn ritari helst.
- spilar með hljóði sjálfgefið. Aðrir (`follower` prop = `!isHost`) byrja á **mute** (`playerVars.mute: 1`, því fjar-tæki lendir oft á skjánum án nokkurs user-gesture — phase-breyting kemur frá Firebase) og fá „🔇 Unmute to hear the music" hnapp. Valið geymt per tæki (`localStorage` `mmr-player-sound-on`).

Hljóð-endurheimt: `setVolume`-köll á meðan nýtt lag er enn að buffera geta týnst, svo hljóðstaðan er ekki sett fyrr en `onStateChange` → `PLAYING` (`applyAudioOnPlaying`): sound-on → `unMute()` + fade upp; sound-off → `mute()` + forstilltur `setVolume`. 700ms síðar (sound-on) er athugað `isMuted()` — ef vafrinn neitar að af-þagga birtist „tap to unmute" hnappur yfir spilaranum (smellur = gesture → virkar).

Hljóðstyrkur: eigin volume-slaufa + 🔊/🔇 toggle undir spilaranum (`setVolume`, geymt í `localStorage` `mmr-player-volume`) — YouTube-spilarans eigin stýring er óþægileg, sérstaklega í tölvu.

Í DEV er `window.__mmrPlayer` látið vísa á `YT.Player` til að auðvelda prófun.

Þekkt: fjar-spilarar eru ekki sekúndu-samstilltir við host (hvert tæki spilar sitt eintak frá 0 þegar lag hleðst) — nóg fyrir „fylgjast með", ekki fyrir nákvæma samspilun.

**Aldursbundin/embed-bönnuð myndbönd** (kom upp í alvöru spilun — handvirkur hlekkur á aldursbundið YouTube-myndband): YouTube leyfir alls ekki að fella slík myndbönd inn (`onError`, kóði 101/150 = embedding disallowed by owner, 100 = fjarlægt/prívat) — ekkert sem appið getur gert til að þvinga þau til að spilast, þetta er hörð YouTube-takmörkun. `onError` er núna meðhöndlað: `videoError` state hylur spilarann aftur með eigin skilaboðum („⚠️ This video can't play here... Tap Skip song" fyrir host, „...Waiting for the host to skip it" fyrir aðra) í stað þess að skilja YouTube-eigin villuskjá (rautt „Sorry, this content is age-restricted") standa óútskýrðan. `advanceGroup()`/tímamælingin fá aldrei atburði fyrir svona lag (hvorki `PLAYING` né `ENDED`), svo eina leiðin áfram er handvirkt „Skip song →" — sem virkar óháð spilarastöðu, þannig hópurinn festist ekki, en þarf samt að vita AÐ hann eigi að ýta á hann, sem er einmitt það sem nýja skilaboðin leysa.

**Sjálfvirk spilun blokkeruð af vafra (kom upp í alvöru spilun — DuckDuckGo-vafrinn):** host-tækið er sjálfgefið óþaggað (`soundOn: true`), en sumir vafrar (staðfest: DuckDuckGo) leyfa alls ekki sjálfvirka spilun MEÐ HLJÓÐI yfir höfuð — lagið hlóðst inn en spilaðist aldrei sjálfkrafa, host þurfti að ýta handvirkt á Play. Kross-blendinga-effect-ið (skiptin milli laga) hafði nú þegar svona „nudge" (kallar `playVideo()` handvirkt ef staðan er ekki þegar PLAYING/BUFFERING 1,2 sek eftir hleðslu) fyrir ÖLL lög EFTIR það fyrsta — en `onReady`-höndlarinn fyrir allra FYRSTA lagið sem spilarinn hleður hafði þetta bara fyrir þögguðu (follower) greinina, ekki fyrir host-greinina. Lagað: sama „nudge"-athugun bætt við `onReady` fyrir bæði tilvik, svo fyrsta lagið fái sömu vörn og öll hin.

**„Invalid video id" — óheimil YouTube-ID braut spilarann alveg (kom upp í alvöru spilun, staðfest gegnum Sentry):** ólíkt aldursbundnu myndböndunum að ofan (sem YouTube grípur sjálft og sendir `onError`), hendir IFrame Player API-ið ÓGRIPANLEGRI („uncaught, unpromised-catchable") villu djúpt inni í eigin widget-skjali sínu ef `videoId` er ekki nákvæmlega 11 löglegir stafir — `try/catch` í kringum köllin okkar grípur þetta EKKI, af því villan verður til ósamstillt inni í YouTube's eigin loforði (promise), ekki samstillt í okkar eigin kallstæði. Fannst tvöfalt vandamál við beina prófun:
1. Ný `isValidYouTubeVideoId()` (`youtube.ts`) staðfestir sniðið áður en gildi er sent til spilarans yfir höfuð — óheimilt gildi er meðhöndlað nákvæmlega eins og aldursbundið myndband (`videoError` hylur skjáinn, „Tap Skip song").
2. **Mikilvægara:** jafnvel EFTIR þessa hreinsun sprakk villan samt — af því `videoId: undefined` sem LYKILL í `new YTns.Player(host, { videoId: undefined, ... })` hagar sér ÖÐRUVÍSI hjá YouTube en að SLEPPA lyklinum alveg. Lagað með `...(videoId ? { videoId } : {})` í staðinn fyrir `videoId: videoId ?? undefined`. Staðfest með beinni margendurtekinni prófun (þurfti að rekja í gegnum að Vite bætir auka línum við skrána í development-ham, svo línunúmerin í villuboðunum í Sentry pössuðu ekki við frumkóðann beint — náði réttu línunni með því að sækja skrána eins og hún er raunverulega send út).


## Lobby og Game Setup aðskilin (viðbót við CLAUDE.md)

Lobby-skjárinn gerði tvennt á einu korti: sýndi spilaralista OG lét host velja flokk. Þessu er skipt í tvo skjái / tvær phase-ir:

- **Lobby** (`phase: 'lobby'`, `02-Lobby.tsx`) — bara „eru allir komnir?": QR, game code, spilaralisti, „waiting for more players", og (frá 2. umferð) uppsöfnuð stigatafla. Host smellir á **„Set up round"**.
- **Game Setup** (`phase: 'setup'`, `02b-GameSetup.tsx`) — rúmgóður umferðar-stillingaskjár. Núna bara flokkavalið (`CategoryPicker`, syncað lifandi með `chooseCategories`), en lagt upp fyrir fleiri stillingar seinna (Extended Play, umferðarlengd). Host: „Start Submitting Songs" + „← Back to lobby". Aðrir: sjá valinn flokk lifandi + „host is setting up".

Nýjar store-aðgerðir: `startRoundSetup()` (lobby→setup), `backToLobby()` (setup→lobby, opnar join aftur). Join er áfram bara leyft í `phase === 'lobby'` — ef host er kominn í setup og einhvern vantar, fer host „← Back to lobby". Milli umferða: `finalizeRoundIfReady` → `phase: 'lobby'` (stigatafla), svo host í setup aftur.

Þar sem eldri kaflar segja „host velur flokk í Lobby" er átt við þennan Game Setup skjá núna.

## Long/Short lagalengd + sjálfvirk framvinda (viðbót við CLAUDE.md — hluti af lagaspilun í appinu)

Leikstjóri velur hvort umferðin keyrir í „long" eða „short" ham (t.d. valið í lobby-inu, samhliða flokkavali).

### Short
Hópurinn velur á Game Setup nákvæmlega hversu lengi hvert lag spilast: **1 mín / 90 sek / 2 mín** (`SHORT_MODE_CAP_OPTIONS`, sjálfgefið 90 sek, `chooseShortModeCap`, syncað, helst milli umferða eins og `roundMode`).

Lagið spilast ALLTAF valda tímann og skiptir svo yfir í næsta — óháð því hvort allir séu búnir að giska/gefa einkunn eða ekki. Eina sem getur stytt það er annað hvort a) lagið er styttra en valdi tíminn og klárast sjálft (`onEnded`), eða b) leikstjórinn (sá sem bjó til lobby-ið) ýtir á „Skip song".

### Long
Lagið fær að klárast (náttúrulegt `ENDED` frá YouTube IFrame Player API) og þá er sjálfkrafa skipt í næsta lag — nema sá sem bjó til lobby-ið (leikstjórinn) velji að skipta handvirkt yfir í næsta lag fyrr sjálfur.

Í báðum hömum er sjálf skiptingin gerð með fade-út/fade-inn (mjúk hljóðlækkun/hækkun gegnum `setVolume` á IFrame-spilaranum), ekki harkalegt skipti.

### Mikilvægt atriði #1 — tónlistin má ALDREI stoppa
Um leið og skiptiskilyrðið næst (lag klárast, valdi tíminn í short-ham næst, eða host skippar) VERÐUR næsta lag að byrja sjálfkrafa — óháð því hvort einhver einstakur notandi er ennþá ófinished með að giska/gefa einkunn fyrir núverandi lag. Ef tónlistin stoppar af því einhver var ekki tilbúinn, drepur það stemninguna í partýinu (buzz killer). M.ö.o.: framvinda tónlistarinnar fyrir HÓPINN og staða HVERS EINSTAKS notanda eru tvö algjörlega aðskilin kerfi — annað ræður hvenær næsta lag byrjar fyrir alla, hitt er persónulegt og hindrar aldrei hitt.

### Mikilvægt atriði #2 — ólokin giskun/einkunn: farið til baka + sjónræn merking
Ef umskiptin verða áður en einhver notandi er búinn að giska/gefa einkunn fyrir það lag, má hann klára það seinna — fara til baka í listann yfir spiluð lög umferðarinnar og klára giskið/einkunnina þá. Þetta er óhætt af því eigendur laga eru ekki afhjúpaðir fyrr en á Results-skjánum í lok umferðarinnar, svo enginn hefur upplýsingaforskot þótt hann klári seinna en aðrir.

Til að gera þetta skýrt fyrir notandanum: spjaldið fyrir lag sem hann á enn eftir að giska/gefa einkunn fyrir á að vera í ÖÐRUM LIT en lög sem hann er búinn með — áberandi merking sem segir „þú átt eftir að gera þetta hér", og breytist í venjulegan/„lokið" lit um leið og hann klárar það.

### Staða — útfært
- `roundMode: 'short' | 'long'` valið á Game Setup (`chooseRoundMode`), syncað. Sjálfgefið `'short'`, helst milli umferða.
- `advanceGroup()` er EINI ritarinn að hópframvindu — kallað bara af host-tækinu (driver-effect + „Skip song" takki). Fer í næsta lag eða, komið fram hjá síðasta lagi, setur `roundPlaythroughDone: true`.
- **Short**: host advanc-ar þegar `onCap` (valda tímalengdin, `shortModeCapSeconds`) EÐA `onEnded` — ekki lengur tengt við hvort giskað/einkunn gefin er. Lag án video → wall-clock jafn lengi og `shortModeCapSeconds`.
- **Long**: host advanc-ar bara við `onEnded` eða „Skip song".
- `NowPlayingPlayer` (host) fylgist með `getCurrentTime()` (1s poll) og `PlayerState.ENDED` og kallar `onCap`/`onEnded` (hvert latch-að einu sinni per video). Pollið er ræst frá `onReady`/lagaskipta-effectinu — EN líka frá sér effect á `[capSeconds]`, því annars situr eftirmaður hosts (sjá Host-arftaki) sem var „follower" þegar núverandi lag byrjaði (pollið skilaði sér snemma af því `capSeconds` var þá `null`) fastur án pollunar á því sama lagi þar til næsta lag — short-reglan hætti að virka og lagið kláraðist alveg í staðinn. `startPoll` er alltaf óhætt að kalla aftur (byrjar á `clearPoll()`).
- Wrap-up (`roundPlaythroughDone`): spilari stoppaður, „All songs played — finish your answers below.", klára ólokið lög, „Confirm final answers" → host „See Results".
- Persónuleg sýn (`viewIndex`) fylgir hópnum bara ef spilari er búinn með lagið sem hann er á — annars situr hún kyrr.
- Vafur milli laga: „← Previous" / „Next →" stepper, stór (`py-3.5`, `flex-1`), beint undir lagaspjaldinu (fyrir ofan „Whose song is it?"/rating/submit) svo hann sé áberandi þegar fólk er að fara fram og til baka til að klára/breyta svörum. Í spilun nær hann aftur að lagi í gangi; í wrap-up yfir öll lög. Hvorugur takkinn hreyfir hópinn. „Reviewing an earlier song — jump back…" banner þegar spilari er ekki á laginu í gangi.
- Eftir Submit/Update Answer: skjárinn hoppar EKKI lengur sjálfkrafa til baka í lagið sem er í gangi (var `setViewIndex(currentSongIndex)` í `handleSubmit`, tekið út) — spilari er kyrr á laginu sem hann var að klára, svo hann geti farið yfir/leiðrétt fleiri eldri lög í röð án þess að þurfa að flakka til baka eftir hverja breytingu. Takkinn sjálfur sýnir „✓ Saved" (grænn, stutt scale-pop) í `SAVED_FLASH_MS` (1.4s) áður en hann fer aftur í „Update Answer"/„Submit".
- Þegar spilari á eftir að giska/gefa einkunn fyrir lagið sem hann skoðar verður `SongCard` bleikt (`needsAnswer` → `border-pink`/`bg-pink/15`/`text-pink`) — „umhverfið" gefur til kynna að hann sé ekki búinn.
- Þekkt takmörkun: ef host bakgrunnar appið mið-lag stoppa timer-ar; host-failover er sérstakt seinna verk.

## Overview-yfirlitskort í lok umferðar (viðbót við CLAUDE.md — hluti af lagaspilun í appinu)

Þegar síðasta lagið í umferðinni klárast (eða skipt er yfir í það, sbr. long/short-hamana) er ÖLLUM sjálfkrafa flett yfir á nýtt „overview"-yfirlitskort — engin bið eftir aðgerð frá neinum.

### Uppbygging kortsins

**Efri tafla (persónuleg, ólík fyrir hvern notanda):** ein lína á hvert lag sem spilað var þá umferð — `Lag — Giskið mitt — Einkunn mín`. Sýnir eigin svör hvers og eins, ekki annarra.
- Hver lína er SMELLANLEG: smellt er á línu til að fara beint aftur í það lag og breyta gisk/einkunn.
- Ef notandi á eftir að svara einhverju (gleymdi, var upptekinn þegar lagið spilaði) er sú lína merkt í ÖÐRUM LIT — smellt er á hana til að fara beint í lagið og ljúka skráningunni.

**Neðri tafla (sameiginleg, sýnileg öllum eins):** `Player | Confirmed` — sýnir hvort hver spilari í leiknum hafi merkt sín svör „confirmed". Fylgir statusinn í rauntíma (t.d. „2/2 have answered this song" texti ofar á skjánum).

**„Confirmed — waiting for others" hnappur:** hver notandi ýtir sjálfur á þennan hnapp þegar hann er sáttur við sín svör (allar línur í efri töflunni búnar/staðfestar). Hnappurinn verður óvirkur/grár eftir að ýtt er á hann og sýnir bara stöðu („waiting for others").

**„See Results →" hnappur:** sýnilegur fyrir LEIKSTJÓRA einan, virkjast/verður áberandi þegar neðri taflan sýnir að (næstum) allir séu „confirmed". Leikstjóri ýtir sjálfur á hann þegar hann metur stundina rétta — ENGIN sjálfvirk tímamörk. Sama mynstur og „Byrja leik" í lobby-inu: leikstjóri stýrir taktinum, ekki klukka.

### Af hverju þetta skiptir máli
Þetta kort er jafnframt svarið við því hvernig spilarar komast til baka og klára/breyta giski og einkunn fyrir fyrri lög umferðarinnar — kortið ER sú leið, ekki sér listi einhvers staðar annars staðar. Það er líka óhætt af sömu ástæðu og áður: eigendur laga eru ekki afhjúpaðir fyrr en á Results-skjánum, svo engin ósanngirni fylgir því að einhver klári/breyti svörum sínum síðar en aðrir.

### Staða — útfært
- `05-GuessAndRate.tsx`: `wrapUpEditing` (local, sjálfgefið `false`) skiptir wrap-up-skjánum milli tveggja stiga — núllstillt í `false` í hvert sinn sem `roundPlaythroughDone` verður `true`, svo ALLIR lenda á yfirlitskortinu sjálfkrafa, aldrei beint inn í eitt lag.
- **Yfirlit** (`!wrapUpEditing`): „All songs played!" + smá staða-lína (talning ólokinna laga eða „Check your answers below"). Efri taflan er `songs.map(...)` — Song / Your guess / Rating; `Your song` fyrir eigið lag, annars giskaði spilarinn eða „Tap to answer"; röð með ólokið svar er bleik (`bg-pink/10`, `text-pink`, sami litur og `SongCard`s `needsAnswer`). Sérhver röð er `<tr onClick>` sem kallar `openSongInOverview(i)` → `setViewIndex(i); setWrapUpEditing(true)`. Neðri taflan (Player/Confirmed) og „Confirm final answers" óbreytt frá fyrra korti.
- **Að breyta einu lagi** (`wrapUpEditing`): „← Back to overview" banni (sami stíll og gamla „Reviewing an earlier song" bannerinn), svo `SongCard` + Prev/Next + `AnswerForm` fyrir bara það lag sem valið var. Hér — ólíkt mið-umferð — HOPPAR skjárinn sjálfkrafa til baka í yfirlitið eftir Submit/Update Answer: „✓ Saved" fær að sjást í `RETURN_TO_OVERVIEW_DELAY_MS` (1s), svo `setWrapUpEditing(false)`. Tímarinn er geymdur í `returnToOverviewRef` og hreinsaður (`clearReturnToOverview`) ef spilari smellir sjálfur á Prev/Next/aðra röð/„Back to overview" áður en hann rennur út, svo hann geti aldrei rykkt manni óvænt til baka úr lagi sem viðkomandi er þegar farinn að skoða.
- „See Results →": birtist ekki fyrr en `allConfirmed` (BÓKSTAFLEGA allir spilarar staðfestir) — reynt var að sleppa þessari lás alveg (host má sjálfur ákveða hvenær), en það leyfði host að fara í úrslit áður en allir voru búnir að staðfesta gisk/einkunnir sínar, sem er ekki ætlunin. Lásinn er því aftur inni, óbreyttur frá upprunalega korti fyrir yfirlitið. Ekkert sjálfvirkt tímamark eftir sem áður — host ýtir sjálfur á hnappinn þegar hann birtist. Aðrir sjá hnappinn óvirkan með „Waiting for {host} to see results" (bara eftir að hann birtist, þ.e. eftir að allir eru staðfestir).

## „Triple Down" — endurúthlutun á einkunn með sjálfvirkri keðjulækkun (viðbót við CLAUDE.md — hluti af einkunnagjöf)

### Samhengi
Einkunnagjöfin er STÖK úthlutun, ekki frjáls endurtekin einkunn: hver giskandi úthlutar hverju lagi (nema sínu eigin) einu gildi úr skalanum 0 til N−2, og sama gildi má ekki nota tvisvar (sjá „Einkunnaskalinn — uppfært, dynamískt" í spec-skjalinu). Í grunnútfærslunni þýðir þetta að þegar notandi er kominn áleiðis í að gefa einkunnir (t.d. búinn að úthluta 1, 3, 4, 5, 6, 7, 8 á sjö lög, og á þá eftir 0, 2, 9 og 10 fyrir þau lög sem eftir eru) er hann bundinn við að velja næsta gildi ÚR ÞEIM sem enn eru laus.

„Triple Down" er flýtileið sem leyfir notanda að velja gildi sem ÞEGAR ER í notkun hjá öðru lagi — appið sér þá sjálfkrafa um að endurraða gildunum fyrir neðan svo skalinn haldist gildur (engin tvítekning).

### Dæmi
Notandi er búinn að úthluta: 1, 3, 4, 5, 6, 7, 8 (lög A–G). Ónotuð gildi: 0, 2, 9, 10. Hann vill núna gefa nýju lagi (t.d. því sem hann telur nýjasta lagið) einkunnina **7** — sama gildi og lag F er nú þegar með.

Útkoman:
- Nýja lagið fær **7**.
- Lag F (var 7) → **6**
- Lag E (var 6) → **5**
- Lag D (var 5) → **4**
- Lag C (var 4) → **3**
- Lag B (var 3) → **2** (fyllir upp í eyðuna sem var þar)
- Lag A (var 1) → **helst óbreytt í 1** — keðjan brotnar á milli 3 og 1 af því 2 var autt (eyða) áður en B færðist þangað.

### Almenna reglan (algorithm)
Þegar notandi velur gildi **V** sem er þegar í notkun:
1. Finndu samfellda runu af NÚVERANDI úthlutuðum gildum sem byrjar á V og heldur áfram niður á við ÁN eyðu (þ.e. V, V−1, V−2, … svo lengi sem hvert þeirra er þegar í notkun).
2. Láttu þessa runu „falla" um eitt þrep hvor — hver haldari lækkar um 1 (V → V−1, V−1 → V−2, o.s.frv.), þar til neðsta gildið í runinni fellur inn í fyrstu eyðuna sem er fyrir neðan hana (autt gildi sem enginn hélt á).
3. Þar STOPPAR keðjan sjálfkrafa — allt fyrir neðan þá eyðu er ósnert, af því eyðan „gleypir" hreyfinguna og engin frekari árekstur verður.
4. Nýja lagið fær sjálft gildið V.

Þetta er í raun „insert-and-cascade": sett er tvítekið gildi efst í rununa, og allt sem á undan var samfellt undir því ýtist niður um eitt þrep þar til fyrsta lausa sætið tekur við höggið.

### Brúnatilvik sem þarf að ákveða
Hvað gerist ef runan sem er samfelld niður frá V nær alla leið niður í 0 — þ.e. EKKERT autt gildi er fyrir neðan V til að „gleypa" keðjuna? Þá er ekkert pláss til að láta keðjuna stoppa (0 getur ekki lækkað í −1). Möguleikar:
- Banna þessa tilteknu endurúthlutun í UI (t.d. gráa út þann valmöguleika) þegar engin eyða er fyrir neðan.
- Eða keðjan gæti í staðinn leitað UPP á við eftir eyðu fyrir ofan og ýtt gildunum þar í staðinn — flóknara og ekki hluti af upprunalegu hugmyndinni.

Einfaldasta og öruggasta útfærslan er líklega sú fyrri: „Triple Down" er einfaldlega ekki í boði fyrir gildi sem hafa enga eyðu fyrir neðan sig í augnablikinu.

### Staða — útfært
- `src/logic/ratingCascade.ts`: hrein `computeCascade(valueToSongId, value)` — gengur niður frá `value` á meðan gildið er þegar í notkun, skilar lista af `{songId, newValue}` (hvert `newValue = gamla gildið - 1`), eða `null` ef keðjan myndi fara niður fyrir 0 (engin eyða). `hasCascadeRoom(...)` er sama fall, bara boolean fyrir UI-notkun.
- `gameStore.ts` — `submitRating(songId, value)`: finnur flokk lagsins, byggir `valueToSongId` (gildi → lagId) úr `ratings` viðkomandi giskanda fyrir HIN lögin í sama flokki (ekki lagið sem er verið að gefa einkunn núna), keyrir `computeCascade`, og skrifar ALLAR breytingarnar (keðjuna + nýja gildið) í EINA `update()`-köll — annaðhvort allt eða ekkert (ef `computeCascade` skilar `null` er ekkert skrifað, ver gegn tvítekningu ef eitthvað kallar þetta án þess að UI hafi þegar útilokað gildið).
- `05-GuessAndRate.tsx` / `AnswerForm`: `takenRatings: Map<number, boolean>` (gildi → má cascade-a) í stað gamla `unavailableRatings: Set<number>`. Takkarnir: frjálst gildi = venjulegur stíll; tekið en cascade-anlegt = `border-dashed border-cyan bg-cyan/10 text-cyan` — SÝNILEGA merkt en samt smellanlegt; tekið án pláss = `disabled` + gamli grái stíllinn. Smá skýringartexti fyrir ofan töfluna („Dashed, cyan numbers are already used...") birtist bara þegar a.m.k. eitt gildi er tekið.
- Prófað: 4 spilarar, gaf gildi 0, síðan 5, síðan reyndi 5 aftur á þriðja laginu — takkinn „5" var sýndur strikóttur/cyan og SMELLANLEGUR (ekki disabled), og eftir Submit hafði annað lagið (sem átti 5) sjálfkrafa lækkað í 4 meðan þriðja lagið fékk 5.

## Villuvöktun — Sentry (viðbót við CLAUDE.md)

### Af hverju
Kom skýrt í ljós í alvöru spilun/playtesti: nokkrir alvöru production-bögglar (t.d. 3x-tvítekin stigagjöf við samtíma „Go to Lobby" smelli) uppgötvuðust bara af því notandinn sjálfur tók eftir skrýtnum tölum og sagði frá — ekkert kerfi hefði annars vitað af því. Villuvöktun grípur svona hluti sjálfkrafa, óháð því hvort einhver labbi á það og nenni að tilkynna.

### Útfærsla
- `@sentry/react` bætt við sem dependency.
- `src/sentry.ts`: `initSentry()` — no-op ef `VITE_SENTRY_DSN` er ekki sett (sama mynstur og `API_KEY`-vörnin í `youtube.ts`), annars `Sentry.init(...)`. Vísvitandi bara villu-vöktun — `tracesSampleRate: 0`, ENGIN Session Replay — appið er nú þegar brennt einu sinni í kvöld af ókeypis-kvóta sem kláraðist (YouTube-leit), svo þetta byrjar íhaldssamt í staðinn fyrir að taka sjálfkrafa þátt í Sentry's eigin kvóta-takmörkuðu eiginleikum.
- `src/components/ErrorFallback.tsx` + `SentryErrorBoundary` (`Sentry.ErrorBoundary`) vefur `<App />` í `main.tsx` — ef eitthvað hrynur í rendering sér notandinn núna „Something went wrong... Reload" í staðinn fyrir tóman hvítan skjá (sem er versta mögulega bilunin mitt í samkvæmisleik).
- `VITE_SENTRY_DSN` bætt við `.env.example` og `.github/workflows/deploy.yml` (sama mynstur og hinir `VITE_*` lyklarnir).

### Staða — útfært og staðfest virkt
`VITE_SENTRY_DSN` GitHub Secret komið inn (Sentry-verkefni „Music Mind Reader" stofnað, org tengt við GitHub repo-ið fyrir stack-trace-samhengi). Staðfest með beinni prófun á lifandi síðunni (tímabundinn `window.__forceCrash` krókur, fjarlægður strax aftur): villa send á lifandi DSN-slóð, Sentry svaraði 200, tölvupóstur barst með fullum stack trace, `environment: production` rétt merkt. Villuvöktunin er raunverulega í gangi, ekki bara uppsett.

Þekkt smáatriði: stack trace sýnir minified fallanöfn (t.d. `Zh`, `pT`) af því engin „source maps" eru uppi hlaðin — lagfæranlegt seinna meir (valfrjálst „Upload Source Maps" skref í Sentry-uppsetningunni) ef það verður til ama, ekki forgangsmál.

## Notkunargögn — GoatCounter funnel-atburðir (viðbót við CLAUDE.md)

### Vandamál sem leyst er
GoatCounter (`index.html` script-taggið, þegar til frá áður) telur bara hráar síðuhleðslur — af því appið er einnar-síðu app sem skiptir um skjái án endurhleðslu, sér það EKKI muninn á einhverjum sem opnar hlekkinn og fer strax út, og hópi sem spilar heilan leik til enda. Spurningin „eru gestir í alvöru að spila leikinn" var ósvarandi með gömlu uppsetningunni.

### Staða — útfært
- `src/analytics.ts`: `trackEvent(name)` — kallar `window.goatcounter.count({ path: name, event: true })` ef scriptið er til staðar (no-op annars, t.d. ef auglýsingablokkari lokar á það — greiningar mega aldrei sjálfar brjóta leikinn).
- Fjórir lykil-atburðir bætt við `gameStore.ts`, hver á sínum eina rétta stað (kallað af einu tæki per raunverulegan atburð, ekki endurtekið á hverju tengdu tæki):
  - `game_created` — `createGame()` tekst
  - `game_joined` — `joinGame()` skilar `'ok'` (bæði glænýr spilari og endurtenging)
  - `round_started` — host ýtir „Start Submitting Songs" (`startSubmitting()`)
  - `round_completed` — host ýtir „See Results" (`finishRound()`)
- Sama GoatCounter-þjónusta og var þegar til — engin ný utanaðkomandi þjónusta, ekkert nýtt kvóta-vandamál til að vakta.
- Skoðað í GoatCounter-mælaborðinu undir „Events" — gefur „funnel": hlutfall gesta sem stofna leik → fá einhvern til að joina → byrja umferð → klára umferð.

## Fyrirfram valinn umferðafjöldi + „Final Scoretable" (viðbót við CLAUDE.md)

### Hugmyndin
Host velur fyrirfram, í fyrstu Game Setup (samhliða umferðarlengd og flokki), hversu margar umferðir hópurinn ætlar að spila (1–4). Appið heldur svo utan um „umferð X af Y" sjálfkrafa — enginn spurður aftur. Þegar síðasta valda umferðin er búin, í stað þess að fara beint í „Go to Lobby"/„Leave Game" eins og allar hinar umferðirnar, birtist á Results-skjánum einn hnappur: **„Final Scoretable →"**. Hann opnar spjaldastokk (paginated, ENGIN hreyfimynd — bara spjöldin) með 6 verðlaunaspjöldum: fimm núverandi lokatitlarnir (Music Mind Reader, Best Taste, Master of Disguise, Most Predictable, Musical Criminal), en núna reiknaðir SAMANLAGT yfir allar spiluðu umferðirnar (ekki bara þá síðustu), auk eins nýs spjalds sem krýnir þann sem endar með HÆST heildarstig („Game Winner"). Fyrst eftir að hafa flett í gegnum spjöldin fer spilarinn í Lobby og sér lokauppsafnaða stigatöfluna. „Leave Game" er alveg tekið út af Results-skjánum fyrir síðustu umferðina — það býr núna bara til í Lobby-inu, og bara EFTIR að leikurinn er í raun búinn (spilaðar umferðir ≥ fyrirfram valinn fjöldi).

### Staða — útfært
- **Gagnalíkan**: `totalRounds` (1–4, sjálfgefið 1) valið einu sinni í fyrstu Game Setup (`chooseTotalRounds` í `gameStore.ts`), helst milli umferða eins og `roundMode`. Fjórir nýir uppsafnaðir teljarar á hverjum leikmanni (`Player` í `types.ts`): `cumulativeCorrectGuesses`, `cumulativeRatingSum`, `cumulativeOwnedSongCount`, `cumulativeGuessedByOthersCount` — færðir inn á sama stað og `totalScore` (`applyRoundScoresIfNeeded`), aldrei núllstilltir milli umferða.
- **`scoring.ts`**: innri per-leikmanns útreikningur `computeTitles` er núna þrjú endurnýtanleg, útflutt föll (`countCorrectGuesses`, `ownSongRatingStats`, `countGuessedByOthers`) — sama rökfræði og áður, bara nafngreind svo bæði stök-umferð og uppsöfnun deili sama upprunakóða. Nýtt `computeCumulativeTitles(players)` — nákvæmlega sama „allir sem deila jaðargildi fá titilinn" rökfræði og `computeTitles`, en les uppsöfnuðu teljarana í staðinn fyrir að endurreikna úr hráum umferðargögnum. Nýtt `computeOverallWinners(players)` fyrir „Game Winner" spjaldið (hæsta `totalScore`, jafntefli innifalið).
- **Mikilvæg tímasetningarlagfæring, fannst í prófun sama kvöld:** verðlaunaspjöldin lesa `players`-fylkið eins og það er ÞEGAR ýtt er á „Final Scoretable →" — en `totalScore`/uppsöfnuðu teljararnir fyrir SÍÐUSTU umferðina færast venjulega ekki inn fyrr en `returnToLobby()` er kallað (sem gerist ekki fyrr en EFTIR að spjöldin hafa þegar verið skoðuð!). Ný `applyFinalRoundScores()` aðgerð (sama innri idempotent fall og `returnToLobby` notar) er því kölluð BEINT úr „Final Scoretable →" hnappnum, á undan því að spjöldin birtast — staðfest með beinni margra-umferða prófun að tölurnar eru réttar (handreiknað og borið saman við skjáinn, allt passaði).
- **Ný component**: `src/components/AwardCard.tsx` (eitt spjald — sérsniðin innfelld SVG-tákn í brand-litunum sem eru þegar til, `AWARD` yfirskrift, titill, nafn/nöfn sigurvegara, undirtexti) og `src/components/FinalScoretableCards.tsx` (heldur utan um hvaða spjald er sýnt, Prev/Next + punktar, „Continue to Scoreboard" sem kallar á núverandi `returnToLobby()` — snertir aldrei sjálft leikjastate).
- **`06-Results.tsx`**: `isLastRound = roundsCompleted + 1 >= totalRounds`. Ný staðbundin `showingFinalCards` staða (sama mynstur og `wrapUpEditing` í `05-GuessAndRate.tsx` — hrein UI-staða, engin ný samstillt fasi/flögg þarf). Titill sem enginn á rétt á er einfaldlega sleppt úr spjaldastokknum.
- **`02-Lobby.tsx`**: nýr „Leave Game" hnappur, sýnilegur bara þegar `roundsCompleted >= totalRounds`.
- **`02b-GameSetup.tsx`**: nýr „Number of rounds" pillu-veljari (1–4), bara gagnvirkur fyrir host ÁÐUR en fyrsta umferð er spiluð (`roundsCompleted === 0`) — annars bara texti („Playing X rounds").
- **„New Game" í Lobby**: þegar leikurinn er búinn (`roundsCompleted >= totalRounds`) kemur „New Game" hnappur (host) í staðinn fyrir „Set up round" — `startNewGame()` núllstillir `totalScore` og öll fjögur uppsöfnuðu teljarana á öllum leikmönnum, og `roundsCompleted` í 0 (sama herbergi/kóði/spilarar haldast). Af því `roundsCompleted` fer í 0, verða „Round length" og „Number of rounds" reitirnir sjálfkrafa gagnvirkir aftur á Game Setup — engin sérstök viðbótarrökfræði þarf fyrir það.

## Kick spilara (viðbót við CLAUDE.md)

### Vandamálið
Kom upp í alvöru spilun: tveir spilarar fóru úr leiknum í miðjum klíðum (líklega með því að loka bara flipanum/appinu, ekki með Home-takkanum) — appið hefur ekkert „presence"-kerfi til að taka eftir svoleiðis (sjá „Host-arftaki" kaflann), svo hópurinn sat fastur og beið eftir giski/einkunn/staðfestingu sem aldrei kom, og engin leið var til að laga það handvirkt.

Sér-tilvik af sama meiði: einhver getur ýtt á „til baka" í vafranum og lent aftur á join-forminu meðan hann er ennþá í herberginu (nafnasamsvörun grípur þetta ekki í allra fyrsta lobby-inu, sjá „Reconnect með sama nafni"), og ef hann nær að skrá sig inn aftur með ÖÐRU nafni áður en `usePhaseNavigation` nær að ýta honum til baka í rétta phase, endar hann með TVÆR raðir í sama leik.

### Staða — útfært
- **`kickPlayer(playerId)`** (host-only, `gameStore.ts`) — aðgengilegt hvenær sem er í leiknum, ekki bara í Lobby. ALLTAF full fjarlæging úr `players` (öfugt við `leaveGame`s hljóðláta mið-leiks-leið sem heldur röðinni eftir) — af ásettu ráði: sum skilyrði annars staðar (t.d. „hafa allir skilað lagi?" í `03-SubmitSong.tsx`) eru reiknuð beint út frá `players.length`, svo bara að merkja einhvern „tilbúinn" (`lobbyReady`/`finalConfirmations`) leysir EKKI þá stöðu — bara að fækka í listanum gerir það. Staðfest með beinni prófun: „Start Guessing" fór úr óvirkum í virkan um leið og kickað var á þann sem vantaði lag.
- **„Players" flipi í hamborgara-valmyndinni** (`MenuOverlay.tsx`), listar alla spilara — aðgengilegt frá ÖLLUM skjám samtímis, ekki bara Lobby, af því valmyndin er alltaf til staðar.
- **`useKickedWatcher`** (`App.tsx`) — nýr watcher: ef þetta tæki á enn `localPlayerId` en finnur sjálft sig ekki lengur í `players`-fylkinu (kickað, eða fjarlægt á annan hátt), keyrir `handleRemovedFromRoom()` (sama staðbundna núllstilling og `leaveGame` gerir, en SKRIFAR EKKERT til baka í herbergi sem tækið á ekki lengur heima í) og siglir heim á forsíðuna sjálfkrafa.
- Ekki reynt að þétta „til baka í vafra" glugga bilsins sjálfan (hætta á brothættri lagfæringu fyrir lítinn ávinning) — „kick" er staðgengillinn: hvað sem gerist, getur host núna hreinsað upp svona tilvik strax.

### Staða — útfært (uppfært: sýnilegt öllum, ekki bara host)
„Players" flipinn er núna sýnilegur ÖLLUM spilurum í herberginu (var áður host-læstur bæði á flipanum sjálfum og innihaldinu) — undirbúningur fyrir „bæta við vin" hnapp á hverja röð þegar vina-fídusinn kemur (sjá „Notendaaðgangur..." kaflann). „Kick" hnappurinn sjálfur er samt ENN bara sýnilegur host — ekki bara að `kickPlayer` hafni öðrum kalli (það gerði hann þegar áður), heldur er sjálfur hnappurinn faldur fyrir alla nema host, svo aðrir sjái ekki takka sem lítur út fyrir að virka en gerir í raun ekkert.

### Staða — útfært (símaútgáfan af valmyndinni — drill-down í stað þess að skruna niður)
Á síma stóðu valmöguleikarnir (Account/How to Play/Players/o.s.frv.) og innihaldið hvort á sínum stað í `flex-col`, svo að velja eitthvað bætti bara efni FYRIR NEÐAN takkana — þurfti að skruna niður til að sjá það. Lagað (`MenuOverlay.tsx`): nýtt `mobilePanelOpen` state — á síma sýnir valmyndin annað hvort takkalistann EÐA valda innihaldið, aldrei bæði (CSS-stýrt með `hidden`/`sm:flex`/`sm:block`, ekkert breytt á breiðari skjám þar sem bæði eru alltaf sýnileg samtímis eins og áður). Að velja Account/How to Play/Players opnar innihaldið beint og sýnir nýjan „← Back" hnapp (bara sýnilegur á síma, `sm:hidden`) sem fer til baka í listann. Sömu leið notuð fyrir utanaðkomandi opnun (CreateJoin's „Sign in"/„CREATE ACCOUNT" í gegnum `uiStore`) svo hún opni beint á innihaldið, ekki bara listann. Privacy Policy/Terms of Service tekin út úr Contact-blokkinni í valmyndinni (voru tvítekin) — lifa núna bara sem fótfesta á forsíðunni.
Staðfest með lifandi Playwright-prófun (4/4 grænt).

### Staða — útfært (drill-down, annað þrep: Account → Friends/My Lists/Stats á síma)
Sama hugmynd endurtekin einu þrepi dýpra: innan Account, að velja Friends/My Lists/Stats á síma skiptir núna alveg yfir í það efni (felur prófíl-hausinn og flipa-röðina) með sínum EIGIN „← Back" sem fer til baka í flipa-listann, ekki alla leið í aðal-valmyndina. Vandamál sem kom upp og var lagað: `mobileSubTabOpen` var upphaflega local state í `AccountPanel.tsx` sjálfu, sem þýddi TVEIR „← Back" hnappar sáust í einu (ytri úr `MenuOverlay` + innri úr `AccountPanel`) þegar farið var inn í t.d. Friends, því ytri hnappurinn vissi ekkert um innra ástandið. Lagað með því að FÆRA `accountSubTabOpen`-state-ið upp í `MenuOverlay` sjálft og gefa það niður sem prop (`subTabOpen`/`onSubTabOpenChange`) — núna felur `MenuOverlay` sinn eigin „← Back" þegar `panel === 'account' && accountSubTabOpen`, svo bara EINN „← Back" sést hverju sinni, og hann fer nákvæmlega eitt þrep til baka. Á breiðari skjám (`sm:` og upp) er þetta allt ósýnilegt — hausinn, flipa-röðin og valda efnið eru öll sýnileg samtímis eins og áður, ekkert drill-down þar.
Staðfest með lifandi Playwright-prófun (7/7 grænt): rétt fjöldi „← Back" hnappa á hverju þrepi, farið rétt til baka eitt þrep í einu, desktop alveg óbreytt.

### Staða — útfært (Account á vafra/borðtölvu: lóðréttur undir-listi + innihald við hliðina, í stað láréttra flipa fyrir ofan)
Notandi benti á fyrra útlitið (láréttir My Lists/Friends/Stats flipar fyrir ofan innihaldið) og bað um að hafa það frekar eins og óvænt („bilað") útlit sem kom upp í fyrri skjáskotum — reyndist ekki galli heldur betri hönnun að mati notanda. `AccountPanel.tsx`s `ReadyView` er núna `sm:flex` gámur: vinstri dálkur (`sm:w-36`) með Account-haus + nafn/númer/tölvupóst + LÓÐRÉTTAN My Lists/Friends/Stats lista (`sm:flex-col`) + Sign out neðst (fært niður fyrir flipana, var áður fyrir ofan þá); hægri dálkur (`sm:flex-1`) sýnir valda innihaldið við hliðina, ekki fyrir neðan. Bara `sm:` og upp — síminn er ALGJÖRLEGA óbreyttur (láréttir flipar, drill-down eins og áður), staðfest með skjáskotum eftir breytinguna.

-------------------------
Ideas going forward:
* Létt, valfrjáls notandaauðkenning (t.d. tengt tæki eða Google-reikningi) — grunnur fyrir tölfræði og „crew"-vinahópa
* Persónuleg tölfræði milli kvölda (flest rétt gisk, hæsta meðaleinkunn, career-titlar, lengsta rétt-gisk-runa)
* Big-screen/TV-hamur fyrir leikstjóra — Now Playing + stigatafla á stærri skjá meðan símar eru controllers
* Deilanleg niðurstöðu-mynd eftir leik (Wordle-stíll) til að deila á samfélagsmiðlum
* i18n / enskt tungumálaval inni í appinu sjálfu (ekki bara markaðsefni)
* Notkunargögn + villuvöktun (t.d. Sentry) áður en notendahópurinn stækkar
---------------------------

## Textaspjall fyrir fjarspilun (viðbót við CLAUDE.md)

### Af hverju
Ef allir spilarar eru í sama herbergi tala þeir bara saman upphátt — spjall-eiginleiki í appinu væri þar bara truflandi klúður á skjánum. En ef einhver er ekki á staðnum (fjarspilun) þarf hann leið til að vera hluti af stemningunni. Þess vegna er spjallið EKKI alltaf til staðar, heldur skilyrt.

### Virkjun
Í Game Setup er valkostur „fjarspilun" sem leikstjóri (eða hver sem er) merkir við ef einhver í hópnum er ekki á staðnum. Sé hann virkjaður birtist fljótandi spjall-tákn neðst á skjánum fyrir alla í leiknum. Sé hann EKKI virkjaður er ekkert spjall-tákn til staðar.

### Hegðun táknsins
- Táknið opnar og lokar spjallinu — sami takki er notaður fyrir bæði (toggle), ekkert sér-lokunartákn.
- Þegar ný, ólesin skilaboð berast verður táknið RAUTT.
- Um leið og notandi OPNAR spjallið hreinsast rauða merkið hjá honum (staðfestir að hann hafi séð skilaboðin).

### Umfang og geymsla
- Hreint TEXTASPJALL — ekki raddspjall/myndspjall. Byggt á sama Firebase Realtime Database-mynstri og annað í leiknum (players/submissions/guesses), t.d. `games/{roomCode}/chat/{messageId}` með sendanda, texta og tímastimpli.
- Spjallið er bundið við lobby-ið sjálft (sama `roomCode`-tré), ekki einstaka umferð eða lag. Spjallsagan lifir þar til allir eru farnir úr lobbyinu — hverfur ekki á milli umferða eða þegar skipt er um skjái innan sama leiks.

### Staðsetning/UX
Spjallið opnast sem létt yfirlag (ekki fullur skjár sem tekur yfir), svo það trufli hvorki Now Playing né giskun/einkunnagjöf — í takt við regluna um að tónlistin/framvindan má aldrei stoppa.

### Staða — útfært
- Gagnalíkan (`gameStore.ts`/`types.ts`): `remotePlayEnabled: boolean` og `chatMessages`/`chatLastRead` á `games/{roomCode}` — `chat/{messageId}` (senderId/senderName/text/timestamp) og `chatLastRead/{playerId}` (tímastimpill síðasta lesturs hvers spilara). `sendChatMessage(text)` sker á `MAX_CHAT_MESSAGE_LENGTH` (500), hunsar tómt/whitespace-only, og skrifar bæði nýja skilaboðið OG sendandans eigin `chatLastRead` í einni `update()` (sendandi telst sjálfur búinn að lesa sitt eigið skilaboð). `markChatRead()` uppfærir bara kallandans eigin `chatLastRead`.
- **Virkjun**: „Remote play" pillu-valkostur (Off/On) á Game Setup, fyrir NEÐAN „Number of rounds" — ólæst, breytanlegt af HVERJUM SEM ER (ekki bara host) í HVERRI umferð, ólíkt „Round length"/„Number of rounds" sem læsast eftir fyrstu umferð.
- **`src/components/ChatOverlay.tsx`**: fljótandi tákn (`fixed bottom-4 right-4`, sami stíll og hamborgari/CODE-merkimiði í hinum hornunum) — sjálf-gagnrýnt á `roomCode && remotePlayEnabled`, birtist því hvergi nema fjarspilun sé virkjuð, en þá á ÖLLUM skjám (mounted í `App.tsx` við hlið `MenuOverlay`/`RoomCodeBadge`). Rautt (`border-danger bg-danger`) þegar nýjasta skilaboðið er yngra en notandans eigin `chatLastRead`; hreinsast um leið og hann OPNAR spjallið (`markChatRead()` kallað beint í smell-höndlara, ekki inni í `setIsOpen`-uppfærslufalli — að kalla state-breytandi hliðarverkun þar olli „Cannot update a component while rendering a different component" villu í React, fannst og lagað í þessari yfirferð). Yfirlagið sjálft (`bottom-20 right-4`, `h-96 w-80`) er lítið spjald, ekki fullur skjár — listi með skilaboðum (eigin hægra megin/primary-litur, annarra vinstra megin með nafni fyrir ofan) + textainnslátur.
- Prófað með Playwright (host + guest, tveir aðskildir `BrowserContext`): tákn ósýnilegt fyrir virkjun, birtist báðum megin um leið og host kveikir á „Remote play", skilaboð frá host birtast hjá guest með rauðu-merki þar til guest opnar spjallið (hreinsast þá), guest svarar í gegnum alvöru UI-innslátt (ekki bara store-köll), host sér svarið og rauða merkið hreinsast þegar hann opnar. Tákn hverfur báðum megin þegar „Remote play" er slökkt aftur.

## Notendaaðgangur, vinir, einkalistar og tölfræði (viðbót við CLAUDE.md)

### Af hverju
Leikurinn er í dag algjörlega nafnlaus/session-based — fólk skrifar bara nafn og joinar herbergi með kóða, engin varanleg auðkenning milli leikja. Notendaaðgangur er grunnstoðin sem eftirfarandi virkni hvílir á: vinir, einkalistar, tölfræði yfir ferilinn, og (síðar) að "remove ads"-kaup fylgi notandanum milli tækja í staðinn fyrir að vera bundið einu tæki/vafra.

Útfært með Firebase Authentication ofan á núverandi Firebase-uppsetningu.

### Auðkenni: nafn + auðkennisnúmer
Hver notandi fær, við skráningu, stutt auðkennisnúmer sem fylgir nafninu sjálfkrafa — t.d. „Jón Þór #4821" (svipað og Discord gerir það). Ástæðan: birt nöfn eru ekki einstök (fleiri en einn getur heitið sama nafni), svo hrein nafnaleit ein og sér gæti skilað mörgum, óljósum niðurstöðum. Með auðkennisnúmerinu til hliðar er alltaf hægt að finna nákvæmlega réttan notanda, jafnvel þótt nafnaleitin sjálf sé einföld og frjáls.

### Vinir
Notandi getur leitað að öðrum notendum eftir nafni (með auðkennisnúmerið til að greina í sundur ef fleiri en einn passar) og bætt þeim við sem vinum.

### Einkalistar — einn per flokk
Hver notandi getur átt sinn eigin, EINKA lista af lögum fyrir hvern flokk sem er til í leiknum (Guilty pleasure, Lag fyrir ræktina, o.s.frv.). Þegar notandi er að skila lagi í umferð þar sem flokkurinn passar við einn af listunum hans, birtast lögin úr þeim lista sem flýtileið til hliðar við handvirku YouTube-leitina — notandinn þarf ekki að muna/leita að góðum lögum upp á nýtt í hvert skipti.

Listarnir eru EINKAMÁL — vinir sjá þá ekki. Þetta er mikilvægt af tveimur ástæðum: annars vegar venjuleg persónuvernd, hins vegar af því sýnilegir listar gætu lekið upplýsingum um hvaða lag einhver er líklegur til að velja í næstu umferð, sem grefur undan sjálfri kjarnahugmynd leiksins (að giska á óþekktan eiganda).

### „+" flýtileið í Now Playing — bjarga lagi sem heyrist í leiknum
Í ramma Now Playing-skjásins er lítill + takki. Ef notandi heyrir gott lag (frá einhverjum öðrum) á meðan á umferð stendur getur hann ýtt á + til að vista það í sinn EIGIN lista. **Uppfært eftir upprunalega drög:** í stað þess að vista sjálfkrafa í flokk virkrar umferðar án spurninga, opnar + takkinn núna lítinn lista yfir alla flokkana svo notandi velji sjálfur hvaða lista lagið á að fara í (umferðar-flokkurinn er efstur/forvalinn í listanum sem líklegasta valið, en ekkert því til fyrirstöðu að velja annan) — notandans eigin skipulag ræður, ekki endilega umferðin sem lagið kom úr.

Þetta er algjörlega óhætt gagnvart privacy-reglunni um að eigendur laga séu ekki afhjúpaðir fyrr en á Results-skjánum: + takkinn vistar eingöngu sjálft lagið (titil/flytjanda/YouTube-ID), ALDREI hver átti það — notandinn er bara að bjarga laginu fyrir sjálfan sig, ekki að læra neitt um eigandann.

Á eigin lagi (því sem notandinn sjálfur skilaði inn þessa umferð) er + takkinn falinn — netagagnslaust að bjarga eigin lagi til sjálfs sín, og appið veit hvaða lag er hans eigið þá umferð.

### Tölfræði yfir ferilinn
Notandi fær yfirlit yfir eigin sögu í leiknum — t.d. flest rétt gisk, hæsta meðaleinkunn, career-titlar (Music Mind Reader, Best Taste, o.s.frv.) og lengsta rétt-gisk-runu, safnað yfir öll skipti sem hann hefur spilað, ekki bara eina umferð/leik.

### Frestað — stjórnun á listum (seinni tíma verkefni)
Skoðunarskjár er kominn (sjá „Staða — útfært" neðar), en að EYÐA lögum úr lista eða FÆRA lag milli lista er ennþá ekki hannað, meðvitað frestað. Kjarnavirknin (vista sjálfkrafa, birta sem flýtileið eftir flokk, + í Now Playing, skoða listana) er það sem skiptir máli fyrst; endurröðun/eyðing er hrein pólering sem hægt er að bæta við hvenær sem er án þess að hafa áhrif á neitt annað sem er lýst hér að ofan.

### Staða — útfært (hamborgaravalmynd endurskipulögð + „My Lists" skoðunarskjár)
Valmyndin var orðin of full (Home var óljóst — bæði „farðu heim" OG „leaves-aðu leikinn" án staðfestingar — og MMR-sagan átti ekki heima í valmynd sem er opnuð mitt í leik). Endurröðun (`src/components/MenuOverlay.tsx`): **Account · How to Play · þema · (deilir) · Players (host) · Leave Game (bara í herbergi) · Contact**.
- „Home" tekið út, í staðinn kemur **„Leave Game"** (rautt/danger-litað), bara sýnilegt þegar `roomCode !== null`. Krefst staðfestingar — ENGIN native `confirm()` (appið hefur aldrei notað slíkt), heldur einfalt tveggja-þrepa „Yes, leave" / „Cancel" beint í valmyndinni.
- „About"/MMR-sagan tekin alveg út sem flipi — færð í nýja stöðu-síðu **`public/about.html`** (nákvæmlega sama mynstur og `privacy.html`/`terms.html`, sem appið notaði nú þegar fyrir svona lesefni), tengd með „Our Story" hlekk niðri hjá Contact.
- Ónefndi sjálfgefni „Rules"-flipinn fékk loksins sinn eigin, merktan hnapp: **„How to Play"** (sama efni og áður, Rules+Scoring).
- **„My Lists" undir Account**: `ReadyView` í `AccountPanel.tsx` fékk þrjá undirflipa — **My Lists · Friends · Stats** — fyrir neðan prófíl-upplýsingarnar. Friends/Stats sýna heiðarlegt „coming soon", ekkert falsað UI. Ný `src/components/MyListsPanel.tsx`: ein-skipta sókn (ekki lifandi `onValue`, þetta er einn-notandi-að-skoða samhengi) á `users/{uid}/lists`, sýnir bara flokka sem eiga a.m.k. eitt vistað lag (ekki alla 41), sama fellilista-mynstur og `ScoreBoard.tsx` notar nú þegar (▾ sem snýst við, smella á röð til að opna/loka). Skoðun ein — engin eyðing/færsla ennþá.
- Staðfest með lifandi Playwright-prófun (16/16 grænt): Home/About horfin, How to Play/Leave Game til staðar (Leave Game bara í herbergi), staðfestingarflæðið virkar (Cancel heldur áfram í herberginu, Yes leaves í alvöru), `/about.html` opnast rétt, My Lists sýnir vistað lag og opnast/lokast, Friends/Stats sýna „coming soon".
- **`public/privacy.html` uppfærð í leiðinni**: sagði áður „There is no login system"/„No accounts, no sign-in", ekki lengur satt. Nýir kaflar: „Playing without an account" (gamla textann, endurnefndur), „Optional accounts" (Google/tölvupóstur+lykilorð, nafn+númer opinbert en tölvupóstur aldrei sýnt), „Saved song lists" (einkamál, aldrei hver átti lagið).

### Staða — útfært (Áfangi 1: innskráning + prófíll — vinir/einkalistar/tölfræði enn eftir)
Fyrsti áfangi af þessu er kominn í loftið: Firebase Authentication (bæði Google og tölvupóstur+lykilorð, staðfest val) og opinber prófíll með „Nafn #1234" auðkennisnúmeri, í anda Discord. Innskráning er algjörlega valfrjáls og hefur engin áhrif á núverandi nafnlausa flæðið — `gameStore.ts`, `crypto.randomUUID()`-auðkennið og `mmr_session` eru öll ósnert.

- **Gagnalíkan** — tvær nýjar greinar í Firebase, systur við `games`/`songSearchCache`: `users/{uid}` (`name`, `nameKey`, `discriminator`, `createdAt`) og `usernames/{nameKey}/{discriminator} -> uid` (einkvæmnis-vísitala). `users/{uid}` er heimslesanlegt (þarf að vera fyrir vina-leit síðar) en bara eigandi má skrifa — tölvupóstfang er ALDREI geymt þar, bara í Firebase Auth sjálfu.
- **Auðkennisnúmer-úthlutun** (`claimDisplayName` í `src/state/userStore.ts`): allt að 8 tilraunir af handahófskenndu 4-stafa númeri, hvert `runTransaction`-varið svo tvítekning sé útilokuð (`current === null ? uid : undefined`); mistakist allar 8 (þúsundir nota nú þegar sama nafn) fær notandi skilaboð um að velja annað nafn.
- **`src/state/userStore.ts`** (nýtt) — hrein Zustand-búð, ENGIN persist-middleware (Firebase Auth geymir sitt session sjálft í IndexedDB). `initAuth()` er kallað einu sinni úr `App.tsx` (verndað `authInitialized`-fáni gegn React 19 StrictMode tvíkalli), tengist `onAuthStateChanged` út líftíma síðunnar. Staða: `loading` → `signed-out` | (`needs-profile` ef `users/{uid}` er ekki til, sem grípur bæði fyrstu Google-innskráningu OG nýja tölvupóstsskráningu) → `ready`, eða `profile-error` ef lestur mistekst (ólíkt `songSearchCache` er þetta EKKI falið hljóðlega — notandi þarf að vita að reglurnar gætu vantað).
- **`src/components/AccountPanel.tsx`** (nýtt) — nýr „Account" flipi í hamborgaravalmyndinni (`MenuOverlay.tsx`), ekki host-læstur, virkur á ÖLLUM skjám þ.m.t. allra fyrsta skjánum. Google-hnappur + tölvupóstur/lykilorð-form (sign in/sign up togglað), „Forgot password?" hlekkur, nafnaval-skref fyrir nýja notendur, og prófíl-yfirlit (`Nafn #1234` + sign out) fyrir innskráða.
- **`src/screens/01-CreateJoin.tsx`** — nafnareiturinn fyllist sjálfkrafa út frá prófílnafni EF innskráður og reiturinn er tómur — alltaf breytanlegt eftir á, aldrei krafa.
- **Handvirk Firebase Console skref sem VORU nauðsynleg** (ekkert í kóða/GitHub Secrets, `authDomain` var þegar til staðar): Authentication → Sign-in method → kveikt á Email/Password og Google; Authentication → Settings → Authorized domains → `musicmindreader.com` bætt við (var bara `.firebaseapp.com`/`.web.app` sjálfgefið); Realtime Database → Rules → `users`/`usernames` greinarnar bættar við sem systur `games`/`songSearchCache`.
- **Staðfest með lifandi Playwright-prófun** gegn alvöru dev Firebase-verkefninu (14/14 próf grænt): nýskráning → nafnaval → `Nafn #1234` birtist rétt → lifir af endurhleðslu → sign out → sign in aftur skilar sama nafni/númeri; tveir notendur með sama nafni fá tvö ólík númer (staðfest bæði í UI og með beinni REST-fyrirspurn á `usernames`); óinnskráð skrif á `users/{annar-uid}` hafnað af reglunum (401 Permission denied); nafnlausa flæðið (stofna/joina leik) algjörlega óbreytt; nafnareitur forfyllist en er áfram breytanlegur. Google OAuth-gluggasamþykktarflæðið sjálft var EKKI sjálfvirkt prófað (ekki raunhæft), bara handvirkt af notanda.
- **Forsíðan (`01-CreateJoin.tsx`) endurhönnuð** eftir mockup-um frá notanda, bara sýnileg fyrir ÓinnskráðA: „Sign in" texti efst hægra megin (á móti hamborgaranum, sama horn og `RoomCodeBadge` notar síðar þegar herbergi er til) og nýtt kynningarspjald (`src/components/AccountPromoCard.tsx`) fyrir neðan Join Game hnappinn — bæði opna hamborgaravalmyndina beint á Account-flipann í gegnum nýja, örsmáa `src/state/uiStore.ts` (`pendingMenuPanel`) svo `MenuOverlay` þurfi ekki að afhjúpa sitt innra `isOpen`/`panel` state. Á breiðari skjám (`md:` og upp) raðast spjaldið við hliðina á aðal-dálkinum í stað fyrir neðan (sami stíll og mockup-in sýndu fyrir vafra vs. síma). Nafnareiturinn fékk líka mann-tákn og vinstrijafnaðan texta (í stað miðjujafnaðs) til að passa við mockup-in. Textinn á spjaldinu er vísvitandi aðlagaður að því sem er í raun til NÚNA („Friends, stats and saved songs are coming soon") frekar en mockup-textann sem lofaði þeim eiginleikum strax — forðast að selja notendum eitthvað sem er ekki komið.

### Staða — útfært (+ flýtileið til að vista lög — bara vistunin, ekki flýtileið-við-innsendingu/tölfræði ennþá)
- **Galli fannst og lagaður í leiðinni í ÞEGAR-ÚTFÆRÐU `users`-reglunum frá Áfanga 1:** `.read: true` var sett á `users`-greinina sjálfa (fyrir ofan `$uid`), ekki á stök svæði innan hennar — af því lestrarheimildir í Firebase „cascade-a" niður og er ALDREI hægt að afturkalla neðar í trénu, þýddi þetta að HVER SEM ER gat lesið gagnagrunninn allan (`GET /users.json`) eða heilan prófíl hvers sem er, ekki bara nafn/númer sem átti að vera opinbert — og hefði gert nýju `lists`-greinina (sem á að vera EINKAMÁL) opinbera líka. Lagað með því að færa `.read: true` niður á bara `name`/`nameKey`/`discriminator` sjálf, og hafa `$uid` sjálft (þar með `lists` og `createdAt`) læst á eigandann einan — staðfest með Rules Playground-hermi FYRIR birtingu og REST-prófunum EFTIR (`/users.json` og `/users/{uid}/lists.json` hafna óinnskráðum, `/users/{uid}/name.json` leyfir).
- **Gagnalíkan**: `users/{uid}/lists/{categoryId}/{songKey} -> {title, artist, youtubeVideoId?, youtubeTitle?, savedAt}` — `songKey` er YouTube-video-ID-ið sjálft þegar það er til (tvítekningarvörn ókeypis: sama lag vistað tvisvar í sama flokk skrifar bara yfir sömu færsluna), annars slembið UUID. Ekkert `playerId`/upprunaflokkur geymt — vistunin er nafnlaus af ásettu ráði, sami andi og restin af leiknum (aldrei hægt að læra hver átti lagið af listanum).
- **`src/components/SaveSongButton.tsx`** (nýtt) — sjálfstæð eining ofan í `SongCard`s nýja `action`-slotti (efst hægra megin á kortinu). Falin sjálfkrafa fyrir óinnskráða (athugar `userStore`-stöðu sjálf); kallandinn (`05-GuessAndRate.tsx`) sér bara um að fela hana á EIGIN lagi. Smellur opnar lítinn fellilista yfir alla 41 flokkana (umferðar-flokkurinn efstur undir „THIS ROUND"), val vistar samstundis og takkinn blikkar „✓" í 1,4 sek (sama mynstur og „✓ Saved" á `AnswerForm`).
- **Staðfest með lifandi Playwright-prófun** (15/15 grænt): + birtist á hins spilarans lagi, hverfur á eigin lagi og fyrir óinnskráðan spilara; vistun staðfest með beinni REST-lestri af eiganda-idToken; sama lag vistað tvisvar í sama flokk skilar EINNI færslu (ekki tveim); allar reglu-afturkræfingarprófanir standast; `loadProfile`-lagfæringin (sjá næst) staðfest að hún haldi áfram að virka rétt eftir endurhleðslu.
- **Fylgilagfæring í `userStore.ts`**: `loadProfile` notaði áður `snap.exists()` á ALLAN `users/{uid}` hnútinn til að ákveða hvort prófíll væri til, og `snap.val() as UserProfile` beint — bilaði um leið og `lists` gat verið til sem systurgrein án fullklárðs prófíls. Lagað í `snap.child('name').exists()` + handvirka smíði á `profile`-hlutnum úr nafngreindum reitum, svo `lists`-gögnin blandist aldrei óvart inn í `profile`-hlutinn í state.
- **Böggur sem kom upp í alvöru spilun sama kvöld:** „Couldn't save — try again" á lagi fundið með YouTube-leit. Rótin: `title`/`artist` á `Song` eru það sem var VÉLRITAÐ í leitina — oft autt eða bara brot af texta (sjá `songLabel.ts`), því raunverulega birta nafnið kemur úr `youtubeTitle` þegar leitarniðurstaða er valin. Reglurnar sem settar voru upp kröfðust þess samt að `title`/`artist` væru EKKI tómir strengir (`length > 0`), sem hafnaði nákvæmlega svona lögum. Lagað (Firebase Console, `.validate` á `title`/`artist` undir `lists/$categoryId/$songKey`): tekið `&& newData.val().length > 0` út, bara `isString() && length <= 200` eftir standandi — tómur `title`/`artist` er í lagi svo lengi sem `youtubeTitle` ber alvöru nafnið, alveg eins og restin af appinu meðhöndlar þetta nú þegar. Staðfest með beinni prófun: sama tilvik (tómur artist + youtubeTitle) vistast núna rétt.
- Frestað áfram: að SÝNA/nota vistuðu listana (flýtileið við innsendingu, skjár til að skoða/eyða/færa milli lista) og tölfræðin — sér verkefni.



