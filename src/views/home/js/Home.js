import React from 'react';
import { Link } from 'react-router-dom';

import Image from 'src/components/image/js/Image';
import Base from 'src/components/base/js/Base';

import styles from '../css/Home.scss';

import Cover from '../img/cover.jpg';
import ReactLogoImage from '../img/react-logo.png';

const Home = () => {
  return (
    <Base title='Home' description='This is home page' className={styles.container}>
      <Image
        src={Cover}
        alt="cover"
        height={693}
        width={1280}
        className={styles.cover}
      />
      <div className={styles.content}>
        <h1 className={styles.title}>{'Home sweet home!'}</h1>
        <div>
          <Image
            src={ReactLogoImage}
            alt="react_logo"
            height={100}
            width={100}
          />
        </div>
        <div>
          <Link to="/page1">{'Page 1'}</Link>{' '}
          <Link to="/page2">{'Page 2'}</Link>
        </div>
      </div>
    </Base>
  );
};

export default Home;
