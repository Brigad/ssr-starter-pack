import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { allPosts } from 'src/actions/home';

import styles from '../css/Home.scss';

import ReactLogoImage from '../img/react-logo.png';

const Post = (props) => {
  return (
    <div>
      <h2>News</h2>
      {props.posts.map((item, index) => (
        <div key={index}>
          {item.id}. <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  )
}

class Home extends Component {

  componentWillMount() {
    this.props.allPosts();
  }

  render() {
    const { posts, isError, isLoading } = this.props.homeReducer;

    return (
      <div className={styles.home}>
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
        <div className={styles.content}>
          {isError ? (
            <p>
              Oops.. Something Wrong!<br />
              Please Try Again Reload Page
            </p>
          ) : isLoading ? (
            <h3>Please wait...</h3>
          ) : <Post posts={posts} />}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    homeReducer: state.homeReducer
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ allPosts }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Home);
