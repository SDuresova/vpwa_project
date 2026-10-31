const routes = [
  // Open the login screen when visiting the app's base URL.
  { path: '/', redirect: '/login' },

  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: 'channels/:name', component: () => import('@/pages/IndexPage.vue') }
    ]
  },

  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
      { path: 'registration', component: () => import('@/pages/RegisterPage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }


]

export default routes
