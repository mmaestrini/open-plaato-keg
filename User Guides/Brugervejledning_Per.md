# Pers Bryggeri — Brugervejledning

> En kort guide til dit nye Plaato-system, der erstatter Plaatos cloud
> (som blev lukket ned i maj 2026).

---

## Hvad er det?

Du har nu dit eget Plaato-system, der kører lokalt på en Raspberry Pi.
Det betyder:

- **Dine Plaato-enheder (gærlåse og fad) sender data til Pi'en hjemme hos dig** — ikke til Plaato's servere, som ikke længere findes.
- **Du kan se data fra alle dine enheder** i en webbrowser, både hjemme og fra sommerhuset.
- **Ingen abonnement, ingen cloud, ingen risiko for at det bliver slukket** — du ejer hele systemet selv.

---

## Hvor finder jeg dashboard'et?

Åbn Safari (eller en anden browser) på din iPhone, iPad eller Mac og gå
til:

> **`http://plaato:8085`**

Du skal være forbundet til Tailscale (se nedenfor) — det fungerer på
hjemme-WiFi, sommerhus-WiFi, eller mobildata.

### Tilføj som ikon på hjemmeskærmen

På iPhone: Tryk på **Del**-knappen i Safari → **"Føj til hjemmeskærm"** →
giv det navnet "Plaato". Nu har du et ikon, der åbner direkte i fuld
skærm.

---

## Tailscale — adgang fra alle dine enheder

Tailscale er en gratis app, der lader dine enheder snakke privat med
Pi'en uanset hvor du er.

### Installation

1. Download **Tailscale** fra App Store (på iPhone og iPad) eller fra
   `tailscale.com/download` (på Mac).
2. Log ind med samme konto, som Manuel har sat op til dig.
3. Tænd for forbindelsen i Tailscale-appen.

Når Tailscale er aktiveret, kan du tilgå `http://plaato:8085` fra hvor
som helst i verden — sommerhuset, ferien, tog, alt.

### Tilbage til normalt internet

Tailscale forstyrrer ikke dit almindelige internet. Det kører i
baggrunden og giver dig kun adgang til Pi'en (og andre enheder på dit
tailnet, hvis Manuel tilføjer dem).

---

## Tap Room — forsiden

Forsiden viser dine **aktive haner**: hvilken øl der er på hver hane,
hvor meget der er tilbage, og temperatur.

- **Stort tal** = procentvis tilbage (eller mængde i liter — afhænger af
  indstillingerne).
- **Grøn "SKÆNKER NU"-mærke** = vægten registrerer lige nu, at der
  bliver tappet en øl.
- **Klik på et tap** for at se detaljer om den enkelte hane.

---

## Gærlåse — fermenteringsside

Klik på **"Cellar"** (eller "Kælder" på dansk) i menuen.

For hver gærlås kan du se:

| Felt | Hvad det betyder |
|---|---|
| **Bobler i alt** | Antal bobler siden seneste nulstilling. Nulstil ved start af ny batch. |
| **Bobler / min (live)** | Aktuel hastighed på gæringen. Højere = mere aktiv gæring. |
| **Temperatur** | Måltemperatur ved gærlåsen — ikke nøjagtig væsketemperatur, men en god indikator. |
| **Status** | "Fermenting" (gærer) / "Idle" (ingen aktivitet) / "Done" (færdig). |

### Bobler-pr-minut grafen

Grafen viser udviklingen i gæring over tid. Du kan vælge:

- **1d** — sidste 24 timer (god til daglig opfølgning)
- **3d** — sidste 3 dage (god til at se aktivitetstoppen)
- **7d** — sidste uge (god til at se hele forløbet)

**Sådan læser du grafen:**

- **Stigende kurve i dag 1-2** = gæringen er gået i gang. Forvent toppen
  efter cirka 2-3 dage.
- **Faldende kurve mod dag 5-7** = gæringen aftager. Tæt på færdig.
- **Flad linje ved 0** = enten endnu ikke startet, eller helt færdig.

### Navngiv en gærlås

Klik på en gærlås i listen → udfyld **"Navn"**-feltet med noget
genkendeligt (fx "Primær fermenter", "IPA #14", eller navnet på øllen).
Tryk **Gem**. Navnet bruges overalt i appen efterfølgende.

### Nulstil bobletælleren

Når du starter en ny batch, klik **"Nulstil bobletæller"** på den
relevante gærlås. Det starter optællingen forfra fra 0.

---

## Notifikationer (kommer snart)

Du vil kunne få besked, når gæringen starter (når bobler/min overstiger
en tærskelværdi du selv vælger). Mulighederne er:

- **Push-besked** via gratis app **ntfy** på iPhone — ingen omkostninger
- **E-mail** via Resend — daglig opsummering

Manuel sætter dette op for dig, når funktionen er klar.

---

## Sprog (EN / DK)

Klik på **🇬🇧 / 🇩🇰** i øverste højre hjørne for at skifte mellem
engelsk og dansk. Dit valg huskes til næste gang.

> Bemærk: De danske oversættelser er stadig under udvikling. Hvis du
> ser noget akavet formuleret, så sig til — det rettes nemt.

## Mørk / lys baggrund

Klik på 🌙 / ☀️ ikonet for at skifte mellem mørk og lys baggrund.

---

## Hvis noget ikke virker

### Web-siden vil ikke loade

1. Tjek at Tailscale er aktiveret på din enhed (åbn appen og se den
   står "Connected").
2. Tjek at Pi'en er tændt (lyser rød/grøn ved USB-C strømstikket).
3. Prøv at lukke Safari og åbne igen.

### Pi'en er slukket

1. Tjek strømstikket — det skal være tilsluttet både Pi og stikkontakt.
2. Når strømmen er på, lyser den røde LED konstant og den grønne LED
   flimrer let. Tag et minut at boote.

### En gærlås viser ingen data

1. Tjek at gærlåsen er tilsluttet strøm (USB).
2. Tjek at den er forbundet til samme WiFi-netværk som Pi'en.
3. Hvis netværket er ændret (nyt password, ny router), skal gærlåsen
   nulstilles og konfigureres igen — kontakt Manuel.

### Alt andet

Kontakt **Manuel** med en kort beskrivelse af problemet og et skærm-
billede hvis muligt. Han kan logge på Pi'en hjemmefra via Tailscale og
ofte løse det uden besøg.

---

## Sikkerhed og data

- **Alt data ligger på Pi'en hjemme hos dig** — ikke i skyen.
- **Pi'en er ikke direkte tilgængelig fra internettet** — kun dine
  Tailscale-godkendte enheder kan se den.
- **Dine målinger og indstillinger gemmes i filen `/db/keg_data.bin` og
  `/db/airlock_data.bin`** på Pi'en. Backup = kopiér data-mappen til en
  USB.

---

## Teknisk (for nysgerrige)

| Komponent | Hvad |
|---|---|
| Hardware | Raspberry Pi 4 (4 GB RAM) med SanDisk High Endurance microSD |
| Software | Open Plaato Keg (open-source Elixir-server) — erstatter Plaatos cloud |
| Netværk | Tailscale (privat mesh-VPN, gratis) |
| Data | Erlang DETS — to filer i `/db/`-mappen |
| Pris pr. måned | **0 kr.** Ingen abonnementer, ingen cloud-fees. |

---

*Sidste opdatering: maj 2026 · Vedligeholdt af Manuel*
