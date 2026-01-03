<script setup>
import { onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()

onMounted(() => {
    admin.fetchGames()
})
</script>

<template>
    <div>
        <h2 class="text-xl font-bold mb-4">Multiplayer Games</h2>

        <table class="w-full border">
            <thead>
                <tr class="border-b">
                    <th>ID</th>
                    <th>Variant</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Winner</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="g in admin.games" :key="g.id" class="border-b">
                    <td>{{ g.id }}</td>
                    <td>Bisca de {{ g.type }}</td>
                    <td>{{ g.player1.nickname }}</td>
                    <td>{{ g.player2.nickname }}</td>
                    <td>{{ g.winner?.nickname || '—' }}</td>
                    <td>{{ g.status }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
