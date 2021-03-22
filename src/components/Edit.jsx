import React from 'react';
import { without } from 'lodash';
import { SidebarPortal, BlocksToolbar } from '@plone/volto/components';
import InlineForm from '@plone/volto/components/manage/Form/InlineForm';
import { getBlocksLayoutFieldname } from '@plone/volto/helpers';
import { TABS_BLOCK } from '@eeacms/volto-tabs-block/constants';
import { empty, emptyTab } from '@eeacms/volto-tabs-block/helpers';
import { DefaultEdit } from './templates/default';
import { schema } from './schema';

import config from '@plone/volto/registry';

import '@eeacms/volto-tabs-block/less/tabs-block.less';

const Edit = (props) => {
  const { onChangeBlock } = props;
  const { data = {}, block = null } = props;
  const template = data.template || 'default';
  const tabsData = data.data || {};
  const tabsList = tabsData.blocks_layout?.items || [];
  const tabs = tabsData.blocks || {};
  const [activeTab, setActiveTab] = React.useState(tabsList?.[0]);
  const [activeBlock, setActiveBlock] = React.useState(null);
  const [multiSelected, setMultiSelected] = React.useState([]);
  const blocksState = React.useRef({});
  const activeTabIndex = tabsList.indexOf(activeTab);
  const tabData = tabs[activeTab] || {};

  const TabsEdit =
    config.blocks.blocksConfig[TABS_BLOCK].templates?.[template]?.edit ||
    DefaultEdit;
  const templateSchema =
    config.blocks.blocksConfig[TABS_BLOCK].templates?.[template]?.schema || {};

  const schemaObject = schema(config, templateSchema(config));

  React.useEffect(() => {
    if (!Object.keys(data.data || {}).length) {
      // Initialize TABS_BLOCK
      const tabsData = empty();
      onChangeBlock(block, {
        ...data,
        data: {
          ...tabsData,
        },
      });
      setActiveTab(tabsData.blocks_layout?.items?.[0]);
    }
    /* eslint-disable-next-line */
  }, []);

  const handleKeyDown = (
    e,
    index,
    block,
    node,
    {
      disableEnter = false,
      disableArrowUp = false,
      disableArrowDown = false,
    } = {},
  ) => {
    if (e.key === 'ArrowUp' && !disableArrowUp && !activeBlock) {
      props.onFocusPreviousBlock(block, node);
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' && !disableArrowDown && !activeBlock) {
      props.onFocusNextBlock(block, node);
      e.preventDefault();
    }
    if (e.key === 'Enter' && !disableEnter && !activeBlock) {
      props.onAddBlock(config.settings.defaultBlockType, index + 1);
      e.preventDefault();
    }
  };

  const onChangeTabData = (id, value) => {
    // special handling of blocks and blocks_layout
    if (['blocks', 'blocks_layout'].indexOf(id) > -1) {
      blocksState.current[id] = value;
      onChangeBlock(block, {
        ...data,
        data: {
          ...tabsData,
          blocks: {
            ...tabsData.blocks,
            [activeTab]: {
              ...tabData,
              ...blocksState.current,
            },
          },
        },
      });
    }
  };

  const onSelectBlock = (id, isMultipleSelection, event) => {
    let newMultiSelected = [];
    let selected = id;

    if (isMultipleSelection) {
      selected = null;
      const blocksLayoutFieldname = getBlocksLayoutFieldname(tabData);

      const blocks_layout = tabData[blocksLayoutFieldname].items;

      if (event.shiftKey) {
        const anchor =
          multiSelected.length > 0
            ? blocks_layout.indexOf(multiSelected[0])
            : blocks_layout.indexOf(activeBlock);
        const focus = blocks_layout.indexOf(id);

        if (anchor === focus) {
          newMultiSelected = [id];
        } else if (focus > anchor) {
          newMultiSelected = [...blocks_layout.slice(anchor, focus + 1)];
        } else {
          newMultiSelected = [...blocks_layout.slice(focus, anchor + 1)];
        }
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (multiSelected.includes(id)) {
          selected = null;
          newMultiSelected = without(multiSelected, id);
        } else {
          newMultiSelected = [...(multiSelected || []), id];
        }
      }
    }

    setActiveBlock(selected);
    setMultiSelected(newMultiSelected);
  };

  return (
    <div
      className="tabs-block edit"
      role="presentation"
      onKeyDown={(e) => {
        handleKeyDown(e, props.index, props.block, props.blockNode.current);
      }}
      // The tabIndex is required for the keyboard navigation
      /* eslint-disable jsx-a11y/no-noninteractive-tabindex */
      tabIndex={-1}
    >
      <TabsEdit
        {...props}
        metadata={props.metadata || props.properties}
        template={template}
        multiSelected={multiSelected}
        activeBlock={activeBlock}
        activeTab={activeTab}
        activeTabIndex={activeTabIndex}
        tabsData={tabsData}
        tabsList={tabsList}
        tabs={tabs}
        tabData={tabData}
        setActiveBlock={setActiveBlock}
        setActiveTab={setActiveTab}
        empty={empty}
        emptyTab={emptyTab}
        onChangeTabData={onChangeTabData}
        onSelectBlock={onSelectBlock}
      />

      {props.selected ? (
        <BlocksToolbar
          formData={tabData}
          selectedBlock={activeTab}
          selectedBlocks={multiSelected}
          onChangeBlocks={(newBlockData) => {
            onChangeBlock(block, {
              ...data,
              data: {
                ...tabsData,
                blocks: {
                  ...tabsData.blocks,
                  [activeTab]: {
                    ...tabData,
                    ...newBlockData,
                  },
                },
              },
            });
          }}
          onSetSelectedBlocks={(blockIds) => {
            setMultiSelected(blockIds);
          }}
          onSelectBlock={onSelectBlock}
        />
      ) : (
        ''
      )}
      {!data?.readOnlySettings ? (
        <SidebarPortal selected={props.selected}>
          {activeBlock ? (
            ''
          ) : (
            <InlineForm
              schema={schemaObject}
              title={schemaObject.title}
              onChangeField={(id, value) => {
                onChangeBlock(block, {
                  ...data,
                  [id]: value,
                });
              }}
              formData={data}
            />
          )}
        </SidebarPortal>
      ) : (
        ''
      )}
    </div>
  );
};

export default Edit;