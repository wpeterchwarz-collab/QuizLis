'use strict';
/* Basiswortschatz Italienisch – Berufliches Gymnasium BW, Niveau N, Jahrgangsstufe 2 (Kl. 13, Ziel B1).
   Thematisch geordnet nach den Sachfeldern des Bildungsplans (BPE 5.6–8.6, Profil WG).
   Format je Zeile: italienisch | deutsch */
const LIBRARY = [
  {
    key: 'it13-lavoro', title: 'Kl. 13 · Lavoro – Ausbildung & Bewerbung',
    desc: 'Bildungsplan BPE 8.3: Stellenangebote, Bewerbung, Lebenslauf, Vorstellungsgespräch',
    cards: `
il lavoro | die Arbeit
il posto di lavoro | der Arbeitsplatz
l'offerta di lavoro | das Stellenangebot
l'annuncio | die Anzeige
la candidatura | die Bewerbung
candidarsi | sich bewerben
la lettera di presentazione | das Bewerbungsanschreiben
il curriculum vitae | der Lebenslauf
il colloquio di lavoro | das Vorstellungsgespräch
il datore di lavoro | der Arbeitgeber
il dipendente | der Angestellte, Arbeitnehmer
il collega | der Kollege
lo stipendio | das Gehalt
il contratto di lavoro | der Arbeitsvertrag
a tempo determinato | befristet
a tempo indeterminato | unbefristet
il tirocinio | das Praktikum
l'apprendistato | die Ausbildung (Lehre)
l'apprendista | der Auszubildende
la formazione professionale | die Berufsausbildung
l'esperienza professionale | die Berufserfahrung
le competenze | die Kompetenzen, Fähigkeiten
le conoscenze linguistiche | die Sprachkenntnisse
il titolo di studio | der Schulabschluss
la maturità | das Abitur
la laurea | der Hochschulabschluss
assumere | einstellen
licenziare | entlassen
dare le dimissioni | kündigen (als Arbeitnehmer)
l'orario di lavoro | die Arbeitszeit
il lavoro part-time | die Teilzeitarbeit
il turno | die Schicht
la scadenza | die Frist
lavorare in squadra | im Team arbeiten
affidabile | zuverlässig
flessibile | flexibel
motivato | motiviert
il punto di forza | die Stärke
il punto debole | die Schwäche
Gentile Signora | Sehr geehrte Frau
Egregio Signore | Sehr geehrter Herr
Distinti saluti | Mit freundlichen Grüßen
`,
  },
  {
    key: 'it13-economia', title: 'Kl. 13 · Economia – Wirtschaft & Unternehmen',
    desc: 'BPE 8.2/8.6 (Profil WG): Wirtschaft, Unternehmen, Markt',
    cards: `
l'economia | die Wirtschaft
l'azienda | das Unternehmen, der Betrieb
l'impresa | das Unternehmen
la ditta | die Firma
il settore | die Branche
la produzione | die Produktion
produrre | herstellen, produzieren
il prodotto | das Produkt
il cliente | der Kunde
il fornitore | der Lieferant
il mercato | der Markt
la concorrenza | die Konkurrenz
il fatturato | der Umsatz
il guadagno | der Gewinn, Verdienst
la perdita | der Verlust
i costi | die Kosten
il prezzo | der Preis
la domanda | die Nachfrage (auch: Frage)
l'offerta | das Angebot
l'esportazione | der Export
l'importazione | der Import
la crescita economica | das Wirtschaftswachstum
la crisi economica | die Wirtschaftskrise
l'inflazione | die Inflation
le tasse | die Steuern
investire | investieren
il consumatore | der Verbraucher
la pubblicità | die Werbung
il marchio | die Marke
la sede | der Firmensitz
la filiale | die Filiale, Niederlassung
il reparto | die Abteilung
la globalizzazione | die Globalisierung
la fiera | die Messe
l'ordine | die Bestellung, der Auftrag
la fattura | die Rechnung
consegnare | liefern
la consegna | die Lieferung
`,
  },
  {
    key: 'it13-turismo', title: 'Kl. 13 · Turismo – Tourismus & Reisen',
    desc: 'BPE 8.1/8.6 (Profil WG): Reisen, Hotel, Tourismus',
    cards: `
il turismo | der Tourismus
il turista | der Tourist
la meta turistica | das Reiseziel
l'agenzia di viaggi | das Reisebüro
prenotare | buchen, reservieren
la prenotazione | die Buchung, Reservierung
l'albergo | das Hotel
l'alloggio | die Unterkunft
la camera singola | das Einzelzimmer
la camera doppia | das Doppelzimmer
la mezza pensione | die Halbpension
la pensione completa | die Vollpension
l'agriturismo | der Urlaub auf dem Bauernhof
la reception | die Rezeption
il soggiorno | der Aufenthalt
l'ospite | der Gast
accogliere | empfangen, aufnehmen
l'ospitalità | die Gastfreundschaft
l'alta stagione | die Hauptsaison
la bassa stagione | die Nebensaison
il lavoro stagionale | die Saisonarbeit
il turismo di massa | der Massentourismus
il turismo sostenibile | der nachhaltige Tourismus
il patrimonio culturale | das Kulturerbe
il centro storico | die Altstadt
il paesaggio | die Landschaft
la spiaggia | der Strand
la costa | die Küste
la gita | der Ausflug
la visita guidata | die Führung
il biglietto | die Fahrkarte, Eintrittskarte
andata e ritorno | hin und zurück
la valigia | der Koffer
il viaggiatore | der Reisende
affollato | überfüllt
rilassarsi | sich entspannen
`,
  },
  {
    key: 'it13-societa', title: 'Kl. 13 · Società – Migration & Gesellschaft',
    desc: 'BPE 8.2: Migration, Arbeitslosigkeit, soziales Engagement',
    cards: `
la società | die Gesellschaft
l'emigrazione | die Auswanderung
l'immigrazione | die Einwanderung
emigrare | auswandern
l'emigrante | der Auswanderer
l'immigrato | der Einwanderer
il migrante | der Migrant
il profugo | der Flüchtling
l'integrazione | die Integration
la cittadinanza | die Staatsbürgerschaft
il permesso di soggiorno | die Aufenthaltsgenehmigung
la fuga dei cervelli | die Abwanderung von Fachkräften
la disoccupazione | die Arbeitslosigkeit
disoccupato | arbeitslos
la disoccupazione giovanile | die Jugendarbeitslosigkeit
il lavoro nero | die Schwarzarbeit
il precariato | die prekäre Beschäftigung
la povertà | die Armut
la disuguaglianza | die Ungleichheit
il Mezzogiorno | Süditalien
il divario tra Nord e Sud | das Nord-Süd-Gefälle
la criminalità organizzata | die organisierte Kriminalität
il volontariato | das Ehrenamt, die Freiwilligenarbeit
il volontario | der Freiwillige
impegnarsi | sich engagieren
l'associazione | der Verein
la solidarietà | die Solidarität
il pregiudizio | das Vorurteil
il razzismo | der Rassismus
la discriminazione | die Diskriminierung
la parità dei diritti | die Gleichberechtigung
il calo delle nascite | der Geburtenrückgang
l'invecchiamento della popolazione | die Überalterung der Bevölkerung
vivere con i genitori | bei den Eltern wohnen
il mammone | das Muttersöhnchen (ugs.)
`,
  },
  {
    key: 'it13-ambiente', title: 'Kl. 13 · Ambiente – Umwelt & Klima',
    desc: 'BPE 8.2: Umweltschutz, Klimawandel, Nachhaltigkeit',
    cards: `
l'ambiente | die Umwelt
la tutela dell'ambiente | der Umweltschutz
il cambiamento climatico | der Klimawandel
il riscaldamento globale | die Erderwärmung
l'effetto serra | der Treibhauseffekt
l'inquinamento | die Verschmutzung
inquinare | verschmutzen
l'inquinamento atmosferico | die Luftverschmutzung
le emissioni | die Emissionen, der Ausstoß
l'anidride carbonica | das Kohlendioxid
l'energia rinnovabile | die erneuerbare Energie
l'energia solare | die Solarenergie
l'energia eolica | die Windenergie
i combustibili fossili | die fossilen Brennstoffe
risparmiare energia | Energie sparen
i rifiuti | der Müll, Abfall
la raccolta differenziata | die Mülltrennung
riciclare | recyceln
sostenibile | nachhaltig
la sostenibilità | die Nachhaltigkeit
la siccità | die Dürre
l'alluvione | die Überschwemmung
l'incendio boschivo | der Waldbrand
il ghiacciaio | der Gletscher
le risorse naturali | die natürlichen Ressourcen
lo spreco | die Verschwendung
sprecare | verschwenden
i mezzi pubblici | die öffentlichen Verkehrsmittel
biologico | biologisch, Bio-
a chilometro zero | aus der Region
la biodiversità | die Artenvielfalt
la specie in via di estinzione | die vom Aussterben bedrohte Art
proteggere | schützen
ridurre | verringern, reduzieren
`,
  },
  {
    key: 'it13-media', title: 'Kl. 13 · Media & giovani – Medien & Jugend',
    desc: 'BPE 6.1/8.1: Medien, Digitalisierung, Jugendkultur',
    cards: `
i media | die Medien
i social network | die sozialen Netzwerke
la rete | das Netz, Internet
navigare in internet | im Internet surfen
scaricare | herunterladen
condividere | teilen
pubblicare | veröffentlichen
l'influencer | der Influencer
la digitalizzazione | die Digitalisierung
l'intelligenza artificiale | die künstliche Intelligenz
la dipendenza dallo smartphone | die Handysucht
essere sempre connessi | ständig online sein
il cyberbullismo | das Cybermobbing
la privacy | die Privatsphäre, der Datenschutz
i dati personali | die persönlichen Daten
le notizie false | die Falschnachrichten
la notizia | die Nachricht
il giornale | die Zeitung
il telegiornale | die Fernsehnachrichten
il tempo libero | die Freizeit
uscire con gli amici | mit Freunden ausgehen
la compagnia | die Clique, Freundesgruppe
la moda | die Mode
la tendenza | der Trend
divertirsi | Spaß haben, sich amüsieren
annoiarsi | sich langweilen
la generazione | die Generation
il conflitto generazionale | der Generationenkonflikt
l'indipendenza | die Unabhängigkeit
il futuro | die Zukunft
il sogno | der Traum
realizzarsi | sich selbst verwirklichen
`,
  },
  {
    key: 'it13-italia', title: 'Kl. 13 · Italia – Geografie, Geschichte & Politik',
    desc: 'BPE 8.1/8.2: Geografie Italiens, Geschichte, Politik',
    cards: `
la penisola | die Halbinsel
la regione | die Region
il capoluogo | die Hauptstadt (einer Region)
la capitale | die Hauptstadt (eines Landes)
le Alpi | die Alpen
gli Appennini | der Apennin
il Mar Mediterraneo | das Mittelmeer
l'isola | die Insel
il vulcano | der Vulkan
la Sicilia | Sizilien
la Sardegna | Sardinien
la Toscana | die Toskana
la Lombardia | die Lombardei
Venezia | Venedig
Firenze | Florenz
Napoli | Neapel
Milano | Mailand
Torino | Turin
la Repubblica | die Republik
lo Stato | der Staat
la Costituzione | die Verfassung
il governo | die Regierung
il Presidente della Repubblica | der Staatspräsident
il Presidente del Consiglio | der Ministerpräsident
il Parlamento | das Parlament
le elezioni | die Wahlen
votare | wählen, abstimmen
il partito | die Partei
la democrazia | die Demokratie
l'Unione Europea | die Europäische Union
l'Unità d'Italia | die Einigung Italiens (1861)
il fascismo | der Faschismus
la Resistenza | der Widerstand (1943–45)
la seconda guerra mondiale | der Zweite Weltkrieg
il dopoguerra | die Nachkriegszeit
il miracolo economico | das Wirtschaftswunder
il dialetto | der Dialekt
`,
  },
  {
    key: 'it13-redemittel', title: 'Kl. 13 · Redemittel – Meinung & Textarbeit',
    desc: 'BPE 5.6: Funktionswortschatz für Diskussion, Stellungnahme, Zusammenfassung',
    cards: `
secondo me | meiner Meinung nach
a mio parere | meiner Ansicht nach
penso che | ich denke, dass (+ Konjunktiv)
credo che | ich glaube, dass (+ Konjunktiv)
sono d'accordo | ich bin einverstanden
non sono d'accordo | ich bin nicht einverstanden
da un lato | einerseits
dall'altro lato | andererseits
però | aber, jedoch
tuttavia | dennoch, trotzdem
invece | dagegen, stattdessen
inoltre | außerdem
quindi | also, deshalb
perciò | deshalb
infatti | tatsächlich, in der Tat
anche se | auch wenn
mentre | während
prima di tutto | zuallererst
infine | schließlich
in conclusione | abschließend
per esempio | zum Beispiel
il vantaggio | der Vorteil
lo svantaggio | der Nachteil
la soluzione | die Lösung
il testo tratta di | der Text handelt von
l'autore | der Autor
riassumere | zusammenfassen
il riassunto | die Zusammenfassung
descrivere | beschreiben
analizzare | analysieren
commentare | kommentieren
è importante che | es ist wichtig, dass (+ Konjunktiv)
bisogna | man muss
dipende da | es hängt ab von
Può ripetere, per favore? | Können Sie das bitte wiederholen?
`,
  },
  {
    key: 'it13-participi', title: 'Kl. 13 · Grammatik – Unregelmäßige Partizipien',
    desc: 'BPE 5.7: passato prossimo – gefragt wird der Infinitiv, du schreibst das Partizip',
    cards: `
fatto | fare (machen)
detto | dire (sagen)
stato | essere (sein)
visto | vedere (sehen)
preso | prendere (nehmen)
messo | mettere (legen, stellen)
scritto | scrivere (schreiben)
letto | leggere (lesen)
aperto | aprire (öffnen)
chiuso | chiudere (schließen)
venuto | venire (kommen)
rimasto | rimanere (bleiben)
scelto | scegliere (wählen)
deciso | decidere (entscheiden)
chiesto | chiedere (fragen)
risposto | rispondere (antworten)
nato | nascere (geboren werden)
morto | morire (sterben)
vissuto | vivere (leben)
bevuto | bere (trinken)
perso | perdere (verlieren)
offerto | offrire (anbieten)
speso | spendere (ausgeben)
corso | correre (laufen)
successo | succedere (geschehen)
piaciuto | piacere (gefallen)
conosciuto | conoscere (kennen)
discusso | discutere (diskutieren)
acceso | accendere (anzünden, einschalten)
spento | spegnere (ausschalten)
sceso | scendere (hinuntergehen)
rotto | rompere (zerbrechen)
tradotto | tradurre (übersetzen)
prodotto | produrre (herstellen)
promesso | promettere (versprechen)
risolto | risolvere (lösen)
`,
  },
];

function librarySet(pack) {
  return {
    id: uid(), libKey: pack.key, title: pack.title, desc: pack.desc, termLang: 'it', defLang: 'de',
    created: Date.now(), updated: Date.now(), lastTest: null,
    cards: pack.cards.trim().split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p[0] && p[1]).map(([t, d]) => newCard(t, d)),
  };
}
