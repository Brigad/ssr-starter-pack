import React from 'react';

const RETRY_CHUNK_LOADING_DELAY = 2000;
const ERROR_MESSAGE = 'You seem to be offline, retrying in 2 seconds...';

const asyncComponent = (getComponent) => {
  class AsyncComponent extends React.Component {
    static preloadedComponent = null;

    static loadComponent = async () => {
      let module;

      try {
        module = await getComponent();
      } catch (e) {
        console.info(ERROR_MESSAGE);
      }

      if (!module) {
        const interval = await new Promise((resolve) => {
          setInterval(async () => {
            if (!module) {
              try {
                module = await getComponent();
              } catch (e) {
                console.info(ERROR_MESSAGE);
              }
            } else {
              clearInterval(interval);
              resolve();
            }
          }, RETRY_CHUNK_LOADING_DELAY);
        });
      }

      const Component = module.default;

      AsyncComponent.preloadedComponent = Component;

      return Component;
    };

    constructor(props) {
      super(props);

      this.state = {
        Component: AsyncComponent.preloadedComponent,
      };

      this.mounted = false;
    }

    async componentWillMount() {
      if (!this.state.Component) {
        const Component = await AsyncComponent.loadComponent();

        if (this.mounted) {
          this.setState({ Component });
        }
      }
    }

    componentDidMount() {
      this.mounted = true;
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    render() {
      const { Component } = this.state;

      if (!Component) {
        return null;
      }

      return <Component {...this.props} />;
    }
  }

  return AsyncComponent;
};

export default asyncComponent;
