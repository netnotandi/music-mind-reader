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
