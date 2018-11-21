import React from 'react';
import { Link } from 'react-router-dom';

import styles from '../css/Page2.scss';

const Page2 = () => {
  return (
    <div className={styles.cover}>
      <div>
        {'Page2'}
      </div>
      <div>
        <Link to="/">{'Back to Home'}</Link>
      </div>
    </div>
  );
};

export default Page2;
