/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ShareMenuItemLegacy } from '../types';

import React from 'react';
import { shallow } from 'enzyme';

import { ShareContextMenu, ShareContextMenuProps } from './share_context_menu';

const defaultProps: ShareContextMenuProps = {
  allowEmbed: true,
  allowShortUrl: false,
  shareMenuItems: [],
  sharingData: null,
  onClose: () => {},
  objectType: 'dashboard',
  urlService: {} as any,
};

test('should render context menu panel when there are more than one panel', () => {
  const component = shallow(<ShareContextMenu {...defaultProps} />);
  expect(component).toMatchSnapshot();
});

test('should only render permalink panel when there are no other panels', () => {
  const component = shallow(<ShareContextMenu {...defaultProps} allowEmbed={false} />);
  expect(component).toMatchSnapshot();
});

test('should disable the share URL when set', () => {
  const component = shallow(<ShareContextMenu {...defaultProps} disabledShareUrl />);
  expect(component).toMatchSnapshot();
});

describe('shareContextMenuExtensions', () => {
  const shareContextMenuItems: ShareMenuItemLegacy[] = [
    {
      panel: {
        id: '1',
        title: 'AAA panel',
        content: <div>panel content</div>,
      },
      shareMenuItem: {
        name: 'AAA panel',
        sortOrder: 5,
      },
    },
    {
      panel: {
        id: '2',
        title: 'ZZZ panel',
        content: <div>panel content</div>,
      },
      shareMenuItem: {
        name: 'ZZZ panel',
        sortOrder: 0,
      },
    },
  ];

  test('should sort ascending on sort order first and then ascending on name', () => {
    const component = shallow(
      <ShareContextMenu
        {...defaultProps}
        allowEmbed={false}
        shareMenuItems={shareContextMenuItems}
      />
    );
    expect(component).toMatchSnapshot();
  });

  test('should render a custom panel title when provided', () => {
    const component = shallow(
      <ShareContextMenu
        {...defaultProps}
        objectTypeTitle="Custom object"
        shareMenuItems={shareContextMenuItems}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
