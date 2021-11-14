import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: require('@/components/Main').default
    },
    {
      path: '/barrage',
      name: 'barrage',
      component: require('@/components/Barrage').default
    },
    {
      path: '/answer',
      name: 'answer',
      component: require('@/components/Answer').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
