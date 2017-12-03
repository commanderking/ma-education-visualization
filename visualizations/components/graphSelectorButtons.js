const renderGraphSelectorButtons = (graphSelectorButtons, targetDiv) => {
  if (targetDiv) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'btn-group';
    buttonGroup.setAttribute('role', 'group');
    buttonGroup.setAttribute('aria-label', 'Basic example');

    targetDiv.append(buttonGroup);

    graphSelectorButtons.forEach((option) => {
     const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.setAttribute('type', 'button');
      button.innerHTML = option.name;
      button.addEventListener('click', option.onClick);
      buttonGroup.append(button);
    });
  }
}
