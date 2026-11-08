<script setup>
defineProps({ page: String });
defineEmits(['back']);
const GITHUB = 'https://github.com/lippesola/einteilung';
</script>

<template>
  <article class="legal">
    <button class="btn ghost" @click="$emit('back')">← Zurück</button>

    <section v-if="page === 'impressum'">
      <h2>Impressum</h2>

      <h3>Verantwortlich für die Inhalte dieser Seite</h3>
      <p>
        Micha Preußer<br />
	Lippesola<br />
        c/o Gemeinde am Grasweg e. V.<br />
        Grasweg 5, 32657 Lemgo
      </p>
      <p>E-Mail: <a href="mailto:micha.preusser@lippesola.de">micha.preusser@lippesola.de</a></p>

      <h3>Haftung für Inhalte</h3>
      <p>
        Wir sind für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Rechtswidrige Inhalte entfernen wir,
        sobald sie uns bekannt werden.
      </p>

      <h3>Haftung für Links</h3>
      <p>
        Auf Inhalte externer Seiten haben wir keinen Einfluss. Bei bekannt gewordenen Rechtsverletzungen entfernen wir
        entsprechende Links umgehend.
      </p>

      <h3>Urheberrecht und Quelltext</h3>
      <p>
        Die Inhalte dieser Seite unterliegen dem deutschen Urheberrecht. Der Quelltext dieser Anwendung ist öffentlich
        einsehbar unter <a :href="GITHUB" target="_blank" rel="noopener">github.com/lippesola/einteilung</a>.
      </p>
    </section>

    <section v-else>
      <h2>Datenschutz</h2>

      <h3>Alles bleibt auf deinem Gerät</h3>
      <p>
        Diese Anwendung läuft vollständig in deinem Browser. Es gibt kein Backend und keine Datenbank. Die Dateien, die
        du lädst (Personen- und Gruppen-CSV), werden nicht hochgeladen, nicht an uns oder Dritte übermittelt und nicht
        auf einem Server gespeichert. Auch der Export (CSV, Gruppenübersicht) entsteht lokal in deinem Browser.
      </p>

      <h3>Lokale Speicherung im Browser</h3>
      <p>
        Damit deine Arbeit beim Neuladen nicht verloren geht, speichert die Seite den Arbeitsstand, die
        Spaltenkonfiguration und die Wahl des Designs im <em>localStorage</em> deines Browsers. Diese Daten verlassen
        deinen Rechner nicht. Du kannst sie jederzeit über die Funktionen der Seite zurücksetzen oder in den
        Browsereinstellungen löschen. Auf gemeinsam genutzten Geräten solltest du den Stand nach der Arbeit löschen,
        da er sonst für andere Nutzer des Browsers sichtbar bleibt.
      </p>

      <h3>Keine Cookies, kein Tracking</h3>
      <p>
        Wir setzen keine Cookies, keine Analyse- oder Tracking-Dienste und binden keine externen Inhalte (z. B.
        Schriften, Karten oder Skripte) ein.
      </p>

      <h3>Server-Zugriffe</h3>
      <p>
        Beim Aufruf der Seite werden die statischen Dateien von einem Webserver ausgeliefert. Der Server ist so
        konfiguriert, dass er keine Zugriffsprotokolle schreibt. Technisch bedingt verarbeitet der Hoster dabei kurzzeitig
        die IP-Adresse, um die Seite ausliefern zu können.
      </p>

      <h3>Personenbezogene Daten in deinen Dateien</h3>
      <p>
        Die CSV-Dateien enthalten in der Regel personenbezogene Daten von Teilnehmern und Mitarbeitern (auch von
        Minderjährigen). Für den Umgang mit diesen Dateien, z. B. Aufbewahrung, Weitergabe und Löschung der Exporte,
        bist du selbst verantwortlich. Bitte gib sie nur an Berechtigte weiter und lösche sie, wenn sie nicht mehr
        benötigt werden.
      </p>

      <h3>Deine Rechte und Kontakt</h3>
      <p>
        Da wir über diese Seite keine personenbezogenen Daten erheben, können wir dazu auch keine Auskunft geben. Bei
        Fragen zum Datenschutz erreichst du uns unter
        <a href="mailto:micha.preusser@lippesola.de">micha.preusser@lippesola.de</a>.
      </p>

      <h3>Offener Quelltext</h3>
      <p>
        Du kannst jederzeit prüfen, was die Anwendung tut:
        <a :href="GITHUB" target="_blank" rel="noopener">github.com/lippesola/einteilung</a>.
      </p>
    </section>
  </article>
</template>
