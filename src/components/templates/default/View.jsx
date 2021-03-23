import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { Menu, Tab } from 'semantic-ui-react';
import { RenderBlocks } from '@plone/volto/components';
import { withScrollToTarget } from '@eeacms/volto-tabs-block/hocs';
import { serializeNodes } from 'volto-slate/editor/render';
import { Editor } from 'volto-slate/utils';

import cx from 'classnames';

import '@eeacms/volto-tabs-block/less/menu.less';

const MenuItem = (props) => {
  const { activeTab = null, tabs = {}, setActiveTab = () => {} } = props;
  const { tab, index } = props;
  const title = { children: tabs[tab].title || [], isVoid: Editor.isVoid };
  const titleUndefined =
    !title.children.length || Editor.string(title, []) === '';
  const defaultTitle = `Tab ${index + 1}`;

  return (
    <Menu.Item
      name={defaultTitle}
      active={tab === activeTab}
      onClick={() => {
        setActiveTab(tab);
      }}
    >
      {titleUndefined ? <p>{defaultTitle}</p> : serializeNodes(title)}
    </Menu.Item>
  );
};

const View = (props) => {
  const [hashlinkOnMount, setHashlinkOnMount] = React.useState(false);
  const {
    metadata = {},
    data = {},
    tabsList = [],
    tabs = {},
    activeTabIndex = 0,
    hashlink = {},
    setActiveTab = () => {},
  } = props;
  const uiContainer = data.align === 'full' ? 'ui container' : '';
  const tabsTitle = { children: data.title || [], isVoid: Editor.isVoid };
  const tabsTitleUndefined =
    !tabsTitle.children.length || Editor.string(tabsTitle, []) === '';

  React.useEffect(() => {
    const urlHash = props.location.hash.substring(1) || '';
    if (
      hashlink.counter > 0 ||
      (hashlink.counter === 0 && urlHash && !hashlinkOnMount)
    ) {
      const id = hashlink.hash || urlHash || '';
      const index = tabsList.indexOf(id);
      const parentId = data.id || props.id;
      const parent = document.getElementById(parentId);
      const headerWrapper = document.querySelector('.header-wrapper');
      const offsetHeight = headerWrapper?.offsetHeight || 0;
      if (id !== parentId && index > -1 && parent) {
        if (activeTabIndex !== index) {
          setActiveTab(id);
        }
        props.scrollToTarget(parent, offsetHeight);
      } else if (id === parentId && parent) {
        props.scrollToTarget(parent, offsetHeight);
      }
    }
    if (!hashlinkOnMount) {
      setHashlinkOnMount(true);
    }
    /* eslint-disable-next-line */
  }, [hashlink.counter]);

  const panes = tabsList.map((tab, index) => {
    return {
      id: tab,
      menuItem: () => {
        return (
          <>
            {index === 0 && !tabsTitleUndefined ? (
              <Menu.Item className="menu-title">
                {serializeNodes(tabsTitle)}
              </Menu.Item>
            ) : (
              ''
            )}
            <MenuItem {...props} tab={tab} index={index} />
          </>
        );
      },
      render: () => {
        return (
          <Tab.Pane>
            {' '}
            <RenderBlocks {...props} metadata={metadata} content={tabs[tab]} />
          </Tab.Pane>
        );
      },
    };
  });

  return (
    <>
      <Tab
        menu={{
          className: cx(data.align || 'left'),
        }}
        panes={panes}
        activeIndex={activeTabIndex}
        className={uiContainer}
      />
    </>
  );
};

export default compose(
  connect((state) => {
    return {
      hashlink: state.hashlink,
    };
  }),
  withScrollToTarget,
)(withRouter(View));
