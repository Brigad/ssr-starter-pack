import React from 'react';
import { Link } from 'react-router-dom';

import Page from 'src/entry/js/components/Page';
import styles from '../css/Page1.scss';

const Page1 = () => {
  return (
    <Page title='Page1' description='This is home page1' className={styles.cover}>
      <div>
        {'Page1'}
      </div>
      <div>
        <Link to="/">{'Back to Home'}</Link>
      </div>
    </Page>
  );
};

export default Page1;
