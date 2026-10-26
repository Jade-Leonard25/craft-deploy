import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import DeploymentsView from '@/views/DeploymentsView.vue'
import DeploymentView from '@/views/DeploymentView.vue'
import Dashboard from '@/views/Dashboard.vue'
import GenerateAccount from '@/views/Generate.Account.vue'
import AppHome from '@/views/app.vue'

const guestOnly = ['/login', '/signup', '/generate-account']

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      redirect: '/app',
    },

    // Public landing page
    {
      path: '/app',
      component: AppHome,
      meta: { layout: 'guest' },
    },

    // Guest pages
    {
      path: '/generate-account',
      component: GenerateAccount,
      meta: { layout: 'guest' },
    },
    {
      path: '/login',
      component: LoginView,
      meta: { layout: 'guest' },
    },
    {
      path: '/signup',
      component: SignupView,
      meta: { layout: 'guest' },
    },

    // Dashboard has its own sidebar
    {
      path: '/dashboard',
      component: Dashboard,
      meta: {
        requiresAuth: true,
        layout: 'bare',
      },
    },

    // Authenticated pages use AppLayout with the navbar
    {
      path: '/deployments',
      component: DeploymentsView,
      meta: {
        requiresAuth: true,
        layout: 'app',
      },
    },
    {
      path: '/deployments/:id',
      component: DeploymentView,
      meta: {
        requiresAuth: true,
        layout: 'app',
      },
    },

    // Unknown routes
    {
      path: '/:pathMatch(.*)*',
      redirect: '/app',
    },
  ],
})

router.beforeEach((to) => {
  const { isLoggedIn } = useAuth()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return '/login'
  }

  if (guestOnly.includes(to.path) && isLoggedIn.value) {
    return '/dashboard'
  }
})

export default router
