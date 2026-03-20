import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './Layout';

export const MainLayout: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);
