import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/deployments' },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/signup', name: 'signup', component: () => import('@/views/SignupView.vue') },
    { path: '/deployments', name: 'deployments', component: () => import('@/views/DeploymentsView.vue'), meta: { requiresAuth: true } },
    { path: '/deployments/:id', name: 'deployment', component: () => import('@/views/DeploymentView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, from, next) => {
  const { token } = useAuth()
  if (to.meta.requiresAuth && !token.value) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'signup') && token.value) {
    next('/deployments')
  } else {
    next()
  }
})

export default router
