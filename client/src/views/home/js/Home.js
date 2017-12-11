import React from 'react';
import { Link } from 'react-router-dom';

import styles from '../css/Home.scss';

import ReactLogoImage from '../img/react-logo.png';

const Home = () => {
  return (
    <div className={styles.cover}>
      <div>
        {'Home sweet home!'}
      </div>
      <div>
        <img src={ReactLogoImage} alt="react_logo" className={styles.logo} />
      </div>
      <div>
        <Link to="/page1">{'Page1'}</Link>
      </div>
      <div>
        <Link to="/page2">{'Page2'}</Link>
      </div>
    </div>
  );
};

export default Home;
