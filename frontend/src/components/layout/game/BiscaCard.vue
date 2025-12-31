<script setup>
import { computed } from 'vue'
import { getCardFilename } from '@/lib/utils' // Importa a tua utilidade



const props = defineProps({
    card: {
        type: Object,
        required: true
        //{ suit: 'hearts', value: 'A', flipped: true }
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emits = defineEmits(['clicked'])

const cardImageUrl = computed(() => {
    // Se a carta não estiver virada, mostramos o verso diretamente do frontend
    if (!props.card.flipped) {
        return '/img/cards/semFace.png' 
    }
    
    // getCardFilename deve retornar apenas "c1.png"
    const filename = getCardFilename(props.card.suit, props.card.value)
    return `/img/cards/${filename}`
})

const handleClick = () => {
    if (!props.disabled) {
        emits('clicked', props.card)
    }
}
</script>

<template>
    <div 
        class="relative w-28 h-40 cursor-pointer rounded-xl transition-all duration-200"
        :class="[
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2 hover:shadow-xl'
        ]"
        @click="handleClick"
    >
        <div v-if="!card.flipped" 
             class="w-full h-full bg-purple-600 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
            <span class="text-4xl text-white font-black opacity-30 italic">?</span>
        </div>

        <div v-else class="w-full h-full bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
            <img 
                :src="cardImageUrl" 
                class="w-full h-full object-contain p-1" 
                :alt="`Carta ${card.suit} ${card.value}`"
                @error="(e) => e.target.src = `${serverBaseURL}/img/cards/semFace.png`"
            />
        </div>
    </div>
</template>