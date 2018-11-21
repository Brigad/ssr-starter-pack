import React from 'react';
import { Link } from 'react-router-dom';

import styles from '../css/Page1.scss';

const Page1 = () => {
  return (
    <div className={styles.cover}>
      <div>
        {'Page1'}
      </div>
      <div>
        <Link to="/">{'Back to Home'}</Link>
      </div>
    </div>
  );
};

export default Page1;
