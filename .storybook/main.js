module.exports = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
		'@storybook/addon-links',
    '@storybook/addon-essentials',
		'storybook-dark-mode',
    'storybook-addon-next',
		'@chakra-ui/storybook-addon'
  ],
  framework: '@storybook/react',
  core: {
    builder: 'webpack5'
  },
	features: { emotionAlias: false },
}
