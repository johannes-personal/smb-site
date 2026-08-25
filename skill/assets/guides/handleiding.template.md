<!--
Template for docs/handleiding.md. Generate the filled version from the real
facts schema and page list so it cannot describe a field that does not exist.
Write it in the owner's language. Replace every {{placeholder}} and delete any
section that does not apply to this site.
-->

# Handleiding voor uw website

## In het kort

Er zijn twee plekken waar u iets kunt aanpassen:

- **Mijn gegevens** — uw openingstijden, prijzen, telefoonnummer en adres.
  Dit is wat u het vaakst nodig heeft.
<!-- Only for a site with a collection. Delete otherwise. -->
- **Soorten en merken** — de keuzelijsten die u bij een artikel ziet. Nodig
  zodra u iets gaat verkopen dat er nog niet in staat.
- **Pagina's** — de indeling van een pagina: een blok toevoegen, verplaatsen of
  weghalen. Dit heeft u zelden nodig.

Alles wat u bij **Mijn gegevens** aanpast, verandert overal op de site vanzelf
mee. U hoeft het dus maar op één plek te doen.

## Inloggen

1. Ga naar **{{site_url}}/beheer**
2. Vul uw e-mailadres in ({{owner_email}}) en klik op *Inloggen*
3. U krijgt een e-mail met een link. Klik erop en u bent ingelogd.

Er is geen wachtwoord, dus u kunt er ook geen vergeten.

## Mijn gegevens

<!-- One section per fact that this site actually has. -->

### Openingstijden aanpassen
{{hours_instructions}}

### Een uitzondering toevoegen
Een uitzondering is één losse dag: een feestdag, een extra open dag, of een dag
dat u dicht bent.

1. Klik op **Uitzondering toevoegen**
2. Kies de datum
3. Kies *gesloten*, of vul de tijden in
4. Klik op **Opslaan**

De dag verschijnt daarna vanzelf in de kalender op de site.

### Prijzen aanpassen
{{price_instructions}}
{{external_price_warning}}

### Telefoonnummer of adres aanpassen
Dit staat op elke pagina. U past het hier één keer aan.

## Pagina's

### Een blok toevoegen
1. Ga naar **Pagina's** en kies de pagina
2. Sleep links een blok naar de plek waar u het wilt hebben
3. Klik op het blok om de tekst en foto's in te vullen
4. Klik rechtsboven op **Publiceren**

### Een blok verplaatsen of weghalen
Sleep het blok naar een andere plek, of klik erop en kies **Verwijderen**.
Vergeet niet te publiceren.

### Foto's vervangen
Klik op het blok, klik op de foto en kies een nieuwe. Vul altijd in wat er op
de foto te zien is — dat is nodig voor mensen die de site laten voorlezen, en
Google leest het ook.

## Wat u beter niet zelf doet

{{do_not_touch}}

## Als er iets misgaat

**De site doet het niet.** Bel {{developer_contact}}.

**Ik kan niet inloggen.** Vraag een nieuwe inloglink aan op {{site_url}}/beheer.
Controleer ook uw spamfolder.

**Ik heb per ongeluk iets weggegooid.** Publiceer nog niet. Sluit het scherm en
open het opnieuw — dan staat de laatste gepubliceerde versie er weer.


<!-- Only for a site with a collection. Delete this whole section otherwise. -->
## Soorten en merken

De keuzelijsten bij een artikel. Gaat u iets nieuws verkopen, dan zet u het
hier neer en kunt u het meteen bij een artikel kiezen.

**De naam mag altijd veranderen.** Typt u een andere naam, dan verandert die
overal op de site.

**Het webadres ligt vast.** Achter elke regel staat een grijs stukje tekst,
bijvoorbeeld `/{{example_category_id}}`. Dat staat in het adres van elk artikel
van die soort. Zodra er artikelen in zitten verandert dat niet meer, anders
werken opgeslagen links en Google-resultaten ineens niet meer. Hernoemen mag
dus altijd; het adres blijft zoals het was, en dat ziet vrijwel niemand.

**Weghalen kan alleen als er niets in zit.** Achter elke regel staat hoeveel
artikelen erin zitten. Staat daar meer dan nul, dan doet de knop het niet — de
artikelen zouden niet verdwijnen, maar hun pagina's wel onvindbaar worden. Zet
ze eerst op iets anders, of haal ze weg.

**De volgorde bepaalt u zelf** met de pijltjes. Diezelfde volgorde ziet de
bezoeker in het zoekmenu naast de artikelen.

**Eén ding gaat niet vanzelf:** een nieuwe soort komt niet automatisch in het
hoofdmenu bovenaan de site. Dat bepaalt u apart.
