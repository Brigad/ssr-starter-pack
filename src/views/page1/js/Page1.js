import React from 'react';
import { Link } from 'react-router-dom';

import Image from 'src/components/image/js/Image';

import styles from '../css/Page1.scss';

import Cover from '../img/cover.jpg';

const Page1 = () => {
  return (
    <div className={styles.container}>
      <Image
        src={Cover}
        alt="cover"
        height={693}
        width={1280}
        className={styles.cover}
      />
      <div className={styles.content}>
        <h1 className={styles.title}>{'Page 1'}</h1>
        <div>
          <Link to="/">{'Back to Home'}</Link>
        </div>
      </div>
    </div>
  );
};

export default Page1;
