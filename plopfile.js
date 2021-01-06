module.exports = plop => {
  plop.addHelper('cwd', () => process.cwd())
  plop.setGenerator('m', {
    description: 'Create component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your main name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.js',
        templateFile: 'plop-templates/component/comp.js.hbs',
      },
      {
        type: 'add',
        path: '{{cwd}}/{{pascalCase name}}/index.js',
        templateFile: 'plop-templates/injectable-index.js.hbs',
        skipIfExists: true,
      },
      {
        type: 'append',
        path: '{{cwd}}/{{pascalCase name}}/index.js',
        pattern: '/* PLOP_INJECT_EXPORT */',
        template: 'export { default } from \'./{{pascalCase name}}\'',
      },
    ],
  })
  plop.setGenerator('s', {
    description: 'Create sub component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your main name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '{{cwd}}/{{pascalCase name}}/{{pascalCase name}}.js',
        templateFile: 'plop-templates/component/comp.js.hbs',
      },
      {
        type: 'add',
        path: '{{cwd}}/{{pascalCase name}}/index.js',
        templateFile: 'plop-templates/injectable-index.js.hbs',
        skipIfExists: true,
      },
      {
        type: 'add',
        path: '{{cwd}}/index.js',
        templateFile: 'plop-templates/injectable-index.js.hbs',
        skipIfExists: true,
      },
      {
        type: 'append',
        path: '{{cwd}}/{{pascalCase name}}/index.js',
        pattern: '/* PLOP_INJECT_EXPORT */',
        template: 'export { default } from \'./{{pascalCase name}}\'',
      },
      {
        type: 'append',
        path: '{{cwd}}/index.js',
        pattern: '/* PLOP_INJECT_EXPORT */',
        template: 'export { default as {{pascalCase name}} } from \'./{{pascalCase name}}\'',
      },
    ],
  })
}
