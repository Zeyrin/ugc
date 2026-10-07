# UGC — produit

## Persona
Freelance (CM, agence solo, manager UGC) qui pilote N créateurs livrant des vidéos pour N comptes clients.

## Benchmark
| Outil | Fort | Manque pour ce persona |
|---|---|---|
| Buffer / Later / Metricool / Hootsuite | Planif multi-réseaux, analytics | Pas de workflow créateur, validation client limitée ou payante |
| Planable | Validation client | Cher par espace, pas de retours vidéo au timecode, pas de missions |
| Frame.io | Retours vidéo timecodés | Aucun lien avec planif, stats ou paiement |
| Billo / Insense / Collabstr | Marketplace UGC | Commission, inutile si on a déjà ses créateurs |
| WhatsApp + Drive + Notion | Gratuit, connu | Chaos : versions perdues, retours flous, calcul des gains à la main |

## Insights
1. Les retours vidéo par message ("à 0:12 le texte déborde") sont la première perte de temps.
2. Le client ne veut pas de compte : il veut un lien, regarder, valider.
3. Les créateurs sont payés en fixe + CPM : sans stats centralisées, la paie est un litige.
4. Le client veut une preuve de résultats sans demander.

## Solution (v1)
Brief (mission, fixe, CPM) → upload vidéo → retours au timecode → lien de validation client sans compte → planif (calendrier) → publié (URL) → stats → gains calculés → rapport client par lien public.
Rôles : owner (tout), manager (gère), creator (ses missions, ses vidéos, ses gains).

## Hors v1
Publication auto via API Meta/TikTok/YouTube (nécessite la validation des apps) ; import auto des stats ; upload resumable > 50 Mo.
