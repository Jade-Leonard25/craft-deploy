import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import LoginView from "@/views/LoginView.vue";
import SignupView from "@/views/SignupView.vue";
import DeploymentsView from "@/views/DeploymentsView.vue";
import DeploymentView from "@/views/DeploymentView.vue";
import GenerateAccount from "./views/Generate.Account.vue";
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/generate-account" },
    {path:"/generate-account",component:GenerateAccount},
    { path: "/login", component: LoginView },
    { path: "/signup", component: SignupView },
    { path: "/deployments", component: DeploymentsView, meta: { requiresAuth: true } },
    { path: "/deployments/:id", component: DeploymentView, meta: { requiresAuth: true } },
    { path: "/:pathMatch(.*)*", redirect: "/deployments" },
  ],
});

router.beforeEach((to) => {
  const { isLoggedIn } = useAuth();
  if (to.meta.requiresAuth && !isLoggedIn.value) return "/login";
  if ((to.path === "/login" || to.path === "/signup" || "/generate-account") && isLoggedIn.value) return "/deployments";
});

export default router;
