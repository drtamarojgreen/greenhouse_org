// docs/js/models_toc.js

/**
 * @namespace ModelsTOC
 * @description Handles the fetching, parsing, and rendering of the models' table of contents.
 */
const ModelsTOC = {
  /**
   * @property {string} xmlPath - The path to the XML file containing the model descriptions.
   */
  xmlPath: 'endpoints/model_descriptions.xml',

  /**
   * @property {string} containerSelector - The CSS selector for the container where the TOC will be rendered.
   */
  containerSelector: '#models-toc-container',

  /**
   * @property {Element} container - The container element.
   */
  container: null,

  /**
   * @description Initializes the component.
   */
  init() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) {
      console.error('ModelsTOC: Container not found.');
      return;
    }

    this.loadXML();
  },

  /**
   * @description Fetches and parses the XML data.
   */
  loadXML() {
    fetch(this.xmlPath)
      .then(response => response.text())
      .then(str => new DOMParser().parseFromString(str, "text/xml"))
      .then(data => this.render(data))
      .catch(error => console.error('Error loading XML:', error));
  },

  /**
   * @description Renders the entire table of contents.
   * @param {Document} xmlDoc - The parsed XML document.
   */
  render(xmlDoc) {
    const introData = xmlDoc.querySelector('intro');
    const modelsData = xmlDoc.querySelectorAll('model');

    this.createIntroSection(introData);
    this.createModelSections(modelsData);
  },

  /**
   * @description Creates and renders the introductory section.
   * @param {Element} introData - The XML element for the intro.
   */
  createIntroSection(introData) {
    const introSection = document.createElement('div');
    introSection.className = 'models-toc-intro';

    introData.querySelectorAll('paragraph').forEach(p => {
      const pElement = document.createElement('p');
      pElement.textContent = p.textContent;
      introSection.appendChild(pElement);
    });

    this.container.appendChild(introSection);
  },

  /**
   * @description Creates and renders the model buttons and panels.
   * @param {NodeList} modelsData - The XML elements for the models.
   */
  createModelSections(modelsData) {
    modelsData.forEach(model => {
      const modelId = model.getAttribute('id');
      const title = model.querySelector('title').textContent;

      const button = document.createElement('button');
      button.className = 'model-toc-button';
      button.textContent = title;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `panel-${modelId}`);
      button.addEventListener('click', this.togglePanel.bind(this));
      this.container.appendChild(button);

      const panel = document.createElement('div');
      panel.className = 'model-toc-panel';
      panel.id = `panel-${modelId}`;
      model.querySelector('description').querySelectorAll('paragraph').forEach(p => {
        const pElement = document.createElement('p');
        pElement.textContent = p.textContent;
        panel.appendChild(pElement);
      });
      this.container.appendChild(panel);
    });
  },

  /**
   * @description Toggles the visibility of a model's description panel.
   * @param {Event} event - The click event.
   */
  togglePanel(event) {
    const button = event.currentTarget;
    const panelId = button.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);

    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    button.classList.toggle('active');
    panel.classList.toggle('open');
  },
};

// Initialize the component when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  ModelsTOC.init();
});
