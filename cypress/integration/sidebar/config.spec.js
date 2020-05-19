context('sidebar.configurations', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  const quickStartIds = [
    'initialize',
    'writing-content',
    'preview-your-site',
    'manual-initialization',
    'loading-dialog',
  ];
  quickStartIds.forEach(id => {
    it('go to #quickstart?id=' + id, () => {
      cy.get(
        '.sidebar-nav > :nth-child(1) > :nth-child(1) > ul > :nth-child(1) > a'
      ).click();

      cy.get(`a.section-link[href='#/quickstart?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const configurationIds = [
    'el',
    'repo',
    'maxlevel',
    'loadnavbar',
    'loadsidebar',
    'hidesidebar',
    'submaxlevel',
    'auto2top',
    'homepage',
    'basepath',
    'relativepath',
    'coverpage',
    'logo',
    'name',
    'namelink',
    'markdown',
    'themecolor',
    'alias',
    'autoheader',
    'executescript',
    'noemoji',
    'mergenavbar',
    'formatupdated',
    'externallinktarget',
    'cornerexternallinktarget',
    'externallinkrel',
    'routermode',
    'nocompilelinks',
    'onlycover',
    'requestheaders',
    'ext',
    'fallbacklanguages',
    'notfoundpage',
  ];
  configurationIds.forEach(id => {
    it('go to #configuration?id=' + id, () => {
      cy.get('[href="#/configuration"]').click();

      cy.get(`a.section-link[href='#/configuration?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500); // its more far from the cover
          cy.matchImageSnapshot();
        });
    });
  });

  const morePagesIds = [
    'sidebar',
    'nested-sidebars',
    'set-page-titles-from-sidebar-selection',
    'table-of-contents',
    'ignoring-subheaders',
  ];
  morePagesIds.forEach(id => {
    it('go to #more-pages?id=' + id, () => {
      cy.get('[href="#/more-pages"]').click();

      cy.get(`a.section-link[href='#/more-pages?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const customNavbarIds = [
    'html',
    'markdown',
    'nesting',
    'combining-custom-navbars-with-the-emoji-plugin',
  ];
  customNavbarIds.forEach(id => {
    it('go to #custom-navbar?id=' + id, () => {
      cy.get('[href="#/custom-navbar"]').click();

      cy.get(`a.section-link[href='#/custom-navbar?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const coverIds = [
    'basic-usage',
    'custom-background',
    'coverpage-as-homepage',
    'multiple-covers',
  ];
  coverIds.forEach(id => {
    it('go to #cover?id=' + id, () => {
      cy.get('[href="#/cover"]').click();

      cy.get(`a.section-link[href='#/cover?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const themesIds = ['other-themes'];
  themesIds.forEach(id => {
    it('go to #themes?id=' + id, () => {
      cy.get('[href="#/themes"]').click();

      cy.get(`a.section-link[href='#/themes?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const pluginsIds = [
    'full-text-search',
    'google-analytics',
    'emoji',
    'external-script',
    'zoom-image',
    'edit-on-github',
    'demo-code-with-instant-preview-and-jsfiddle-integration',
    'copy-to-clipboard',
    'disqus',
    'gitalk',
    'pagination',
    'codefund',
    'tabs',
    'more-plugins',
  ];
  pluginsIds.forEach(id => {
    it('go to #plugins?id=' + id, () => {
      cy.get('[href="#/plugins"]').click();

      cy.get(`a.section-link[href='#/plugins?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const writeAPluginIds = ['full-configuration', 'example', 'tips'];
  writeAPluginIds.forEach(id => {
    it('go to #write-a-plugin?id=' + id, () => {
      cy.get('[href="#/write-a-plugin"]').click();

      cy.get(`a.section-link[href='#/write-a-plugin?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const markdownIds = ['supports-mermaid'];
  markdownIds.forEach(id => {
    it('go to #markdown?id=' + id, () => {
      cy.get('[href="#/markdown"]').click();

      cy.get(`a.section-link[href='#/markdown?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  it('go to #Language-highlight', () => {
    cy.get('a[href="#/language-highlight"]')
      .click()
      .then(() => {
        cy.wait(500);
        cy.matchImageSnapshot();
      });
  });

  // const deployIds = [
  //   'github-pages',
  //   'gitlab-pages',
  //   'firebase-hosting',
  //   'vps',
  //   'netlify',
  //   'zeit-now',
  //   'aws-amplify'
  // ]
  // deployIds.forEach(id => {
  //   it('go to #deploy?id=' + id, () => {
  //     cy.get('[href="#/deploy"]').click()

  //     cy.get(`a.section-link[href='#/deploy?id=${id}']`)
  //       .click()
  //       .then(() => {
  //         cy.wait(500)
  //         cy.matchImageSnapshot()
  //       })
  //   })
  // })

  const helpersIds = [
    'important-content',
    'general-tips',
    'ignore-to-compile-link',
    'set-target-attribute-for-link',
    'disable-link',
    'github-task-lists',
    'customise-id-for-headings',
    'markdown-in-html-tag',
  ];
  helpersIds.forEach(id => {
    it('go to #helpers?id=' + id, () => {
      cy.get('[href="#/helpers"]').click();

      cy.get(`a.section-link[href='#/helpers?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const vueIds = ['basic-usage', 'combine-vuep-to-write-playground'];
  vueIds.forEach(id => {
    it('go to #vue?id=' + id, () => {
      cy.get('[href="#/vue"]').click();

      cy.get(`a.section-link[href='#/vue?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const cdnIds = [
    'latest-version',
    'specific-version',
    'compressed-file',
    'other-cdn',
  ];
  cdnIds.forEach(id => {
    it('go to #cdn?id=' + id, () => {
      cy.get('[href="#/cdn"]').click();

      cy.get(`a.section-link[href='#/cdn?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const pwaIds = ['create-serviceworker', 'register', 'enjoy-it'];
  pwaIds.forEach(id => {
    it('go to #pwa?id=' + id, () => {
      cy.get('[href="#/pwa"]').click();

      cy.get(`a.section-link[href='#/pwa?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });

  const ssrIds = [
    'why-ssr',
    'quick-start',
    'custom-template',
    'configuration',
    'deploy-for-your-vps',
  ];

  ssrIds.forEach(id => {
    it('go to #ssr?id=' + id, () => {
      cy.get('[href="#/ssr"]').click();

      cy.get(`a.section-link[href='#/ssr?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(500);
          cy.matchImageSnapshot();
        });
    });
  });
  const embedFilesIds = [
    'embedded-file-type',
    'embedded-code-fragments',
    'embedded-file-order',
    'tag-attribute',
    'the-code-block-highlight',
  ];
  embedFilesIds.forEach(id => {
    it('go to #embed-files?id=' + id, () => {
      cy.get('[href="#/embed-files"]').click();

      cy.get(`a.section-link[href='#/embed-files?id=${id}']`)
        .click()
        .then(() => {
          cy.wait(750);
          cy.matchImageSnapshot();
        });
    });
  });
});
