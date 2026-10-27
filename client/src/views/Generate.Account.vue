<script setup lang="ts">
import { ref } from 'vue';
import Card from '@/components/Card.vue';
import Input from '@/components/Input.vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import {CheckIcon} from 'lucide-vue-next'
const API_URL = 'http://localhost:4002/api/auth';
import Button from '@/components/Button.vue';
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const isGenerating = ref(false);
const isSigningUp = ref(false);
const isLoggingIn = ref(false);

const isGenerated = ref(false);
const isRegistered = ref(false);
const isLoggedIn = ref(false);

const error = ref('');
const message = ref('');
const token = ref('');

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Converts API error responses into readable text.
function getApiError(result: unknown, status: number): string {
    if (result && typeof result === 'object') {
        const data = result as Record<string, unknown>;

        if (typeof data.message === 'string') {
            return data.message;
        }

        if (typeof data.error === 'string') {
            return data.error;
        }

        return JSON.stringify(data);
    }

    return `Request failed with HTTP ${status}.`;
}
const router = useRouter();
const { setToken } = useAuth();
// Safely reads JSON responses from the backend.
async function readResponse(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return { message: text };
    }
}

async function generateAccount(): Promise<void> {
    if (isGenerating.value || isSigningUp.value || isLoggingIn.value) {
        return;
    }

    isGenerating.value = true;
    isGenerated.value = false;
    isRegistered.value = false;
    isLoggedIn.value = false;
    error.value = '';
    message.value = '';
    token.value = '';

    try {
        await delay(2000);

        const randomId = crypto.randomUUID()
            .replaceAll('-', '')
            .slice(0, 8);

        const generatedPassword = `${crypto.randomUUID()}Aa1!`;

        email.value = `user${randomId}@example.com`;
        password.value = generatedPassword;
        confirmPassword.value = generatedPassword;

        isGenerated.value = true;
    } catch {
        error.value = 'Failed to generate account credentials.';
        return;
    } finally {
        isGenerating.value = false;
    }

    await signUp();
}

async function signUp(): Promise<void> {
    if (
        !isGenerated.value ||
        isRegistered.value ||
        isSigningUp.value
    ) {
        return;
    }

    isSigningUp.value = true;
    error.value = '';
    message.value = 'Registering account...';

    try {
        const response = await fetch(`${API_URL}/sign-up`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value,
                password: password.value,
                confirmPassword: confirmPassword.value,
            }),
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(getApiError(result, response.status));
        }

        isRegistered.value = true;

        message.value =
            'Account registered successfully. You can now log in.';
    } catch (err: unknown) {
        isRegistered.value = false;
        message.value = '';

        error.value =
            err instanceof Error
                ? err.message
                : 'Signup failed. Check whether your Hono server is running.';
    } finally {
        isSigningUp.value = false;
    }
}

async function login(): Promise<void> {
    if (
        !isRegistered.value ||
        isLoggingIn.value ||
        isSigningUp.value
    ) {
        return;
    }

    isLoggingIn.value = true;
    error.value = '';
    message.value = 'Logging in...';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value,
                password: password.value,
            }),
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(getApiError(result, response.status));
        }

        if (!result || typeof result !== 'object' || !('token' in result)) {
            throw new Error('Login response did not contain a token.');
        }

        const loginResult = result as Record<string, unknown>;

        if (typeof loginResult.token !== 'string') {
            throw new Error('The login token is not a string.');
        }

        token.value = loginResult.token;
        sessionStorage.setItem('authToken', loginResult.token);
        setToken(loginResult.token);
        await router.push('/dashboard');

        isLoggedIn.value = true;
        message.value =
            typeof loginResult.message === 'string'
                ? loginResult.message
                : 'Login successful.';
    } catch (err: unknown) {
        message.value = '';

        error.value =
            err instanceof Error
                ? err.message
                : 'Login failed. Check your Hono server.';
    } finally {
        isLoggingIn.value = false;
    }
}
</script>

<template>
    <div class='min-h-screen bg-gray-200    '>
        <div class="flex  items-center justify-center  px-4 py-10 text-white">
            <Card class="w-full max-w-md space-y-6 border bg-gray-200 text-black p-6 shadow-xl">
                <header class="space-y-2 text-center">
                    <h1 class="text-2xl font-bold tracking-tight    ">
                        Generated Account
                    </h1>

                    <p class="text-sm text-gray-400">
                        Generate credentials and test your authentication API.
                    </p>
                </header>

                <form class="space-y-5" @submit.prevent="generateAccount">
                    <div class="space-y-2">
                        <label for="email" class="block text-sm font-medium text-black">
                            Email
                        </label>

                        <Input id="email" v-model="email" type="email" placeholder="Generated email" :readonly="true"
                            :disabled="isGenerating || isSigningUp || isLoggingIn" />
                    </div>

                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-black">
                            Password
                        </label>

                        <Input id="password" v-model="password" type="password" placeholder="Generated password"
                            :readonly="true" :disabled="isGenerating || isSigningUp || isLoggingIn" />
                    </div>

                    <div class="space-y-2">
                        <label for="confirmPassword" class="block text-sm font-medium text-black">
                            Confirm Password
                        </label>

                        <Input id="confirmPassword" v-model="confirmPassword" type="password" class="text-black"
                            placeholder="Confirm password" :readonly="true"
                            :disabled="isGenerating || isSigningUp || isLoggingIn" />
                    </div>

                    <Button type="submit" :disabled="isGenerating ||
                        isSigningUp ||
                        isLoggingIn ||
                        isRegistered
                        " variant="default">
                        <span v-if="isGenerating">
                            Generating credentials...
                        </span>
                        <span v-else-if="isSigningUp">
                            Registering account...
                        </span>
                        <span v-else-if="isRegistered">
                            Account Registered
                        </span>
                        <span v-else>
                            Generate &amp; Register Account
                        </span>
                    </Button>
                </form>

                <Button v-if="isGenerated && !isLoggedIn" type="button"
                    :disabled="!isRegistered || isSigningUp || isLoggingIn" @click="login" class="" variant="default">
                    <span v-if="isSigningUp">Registering first...</span>
                    <span v-else-if="isLoggingIn">Logging in...</span>
                    <span v-else>Click here to login</span>
                </Button>

                <div class="flex items-center justify-between gap-2 rounded-lg border border-gray-500 bg-zinc-200 p-4">
                    <p v-if="message" role="status" class="whitespace-nowrap text-sm text-black">
                        {{ message }}
                    </p>

                    <CheckIcon class="h-6 w-6 shrink-0" />
                </div>
                <p v-if="error" role="alert"
                    class="break-words rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {{ error }}
                </p>

                <div v-if="isLoggedIn" class="space-y-2 rounded-lg border border-white/10 bg-gray-950 p-4">
                    <p class="font-semibold text-emerald-400">
                        Authentication successful
                    </p>

                    <p class="text-sm text-gray-400">
                        Your login endpoint returned a token.
                    </p>

                    <p class="break-all text-xs text-gray-500">
                        {{ token }}
                    </p>
                </div>
            </Card>
        </div>
    </div>
</template>
