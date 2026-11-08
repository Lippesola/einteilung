<script setup>
import { computed } from 'vue';
import { COLORS } from '../model/fields.js';
import { store, ui, wishInfo, hasWishes } from '../model/state.js';
import { ageYears, formatDate } from '../utils/date.js';

const props = defineProps({ person: { type: Object, required: true } });

const isMA = computed(() => props.person.type === 'MA');
const age = computed(() => {
  const a = ageYears(props.person.birthday);
  return a === null ? null : a.toFixed(2);
});
const dim = computed(() => {
  const q = ui.search.trim().toLowerCase();
  if (!q) return false;
  return !`${props.person.firstName} ${props.person.lastName}`.toLowerCase().includes(q);
});
const wish = computed(() => (hasWishes.value && !isMA.value ? wishInfo.value[props.person.id] : null));
const showWish = computed(() => wish.value && wish.value.wishes.length > 0);

// Scale values are shown with their meaning (e.g. guitar 2 -> "Ja, ich bin fortgeschritten").
function scaleTag(key, label, value, icon = null) {
  const opt = (store.config.scales[key] || []).find((o) => String(o.value) === String(value));
  return { label, text: opt ? opt.label : value, color: COLORS[opt?.color] || COLORS.grey, icon };
}
const tags = computed(() => {
  const list = [];
  const p = props.person;
  if (p.guitar !== '') list.push(scaleTag('guitar', 'Gitarre', p.guitar, 'guitar'));
  for (const e of p.extras) {
    if (e.kind === 'scale') list.push(scaleTag('extraScale', e.label, e.value));
    else list.push({ label: e.label, text: e.value, color: null, icon: null });
  }
  return list;
});
</script>

<template>
  <div class="person" :class="[isMA ? 'ma' : 'tn', { dim, leader: person.leader }]" @click="!isMA && $emit('open', person)">
    <div class="p-main">
      <div class="p-name">
        {{ person.firstName }} {{ person.lastName }}
      </div>
      <div class="p-meta">
        <AppIcon
          v-if="person.sex"
          :name="person.sex === 'f' ? 'venus' : 'mars'"
          :size="15"
          :class="'sex-' + person.sex"
          :title="person.sex === 'f' ? 'weiblich' : 'männlich'"
        />
        <span
          v-if="showWish"
          class="wish"
          :style="{ color: COLORS[wish.color] }"
          title="Erfüllte Wünsche / Wünsche gesamt"
        >{{ wish.fulfilled }}/{{ wish.total }}</span>
      </div>
      <div v-if="tags.length" class="tags">
        <span v-for="(t, i) in tags" :key="i" class="tag" :title="`${t.label}: ${t.text}`">
          <AppIcon v-if="t.icon" :name="t.icon" :size="14" :style="{ color: t.color }" />
          <i v-else-if="t.color" class="dot" :style="{ background: t.color }"></i>
          <template v-if="t.icon">{{ t.text }}</template>
          <template v-else>{{ t.label }}: {{ t.text }}</template>
        </span>
      </div>
    </div>
    <div class="p-side">
      <button
        v-if="isMA"
        type="button"
        class="gl-toggle"
        :class="{ on: person.leader }"
        :aria-pressed="person.leader"
        :title="person.leader ? 'Gruppenleiter – Klick zum Entfernen' : 'Als Gruppenleiter markieren'"
        @click.stop="person.leader = !person.leader"
      >
        <AppIcon name="bolt" :size="13" :fill="person.leader ? 'currentColor' : 'none'" /> GL
      </button>
      <span v-if="age !== null" :title="formatDate(person.birthday)">{{ age }}</span>
      <small v-if="person.city" :title="person.city">{{ person.city }}</small>
    </div>
  </div>
</template>
