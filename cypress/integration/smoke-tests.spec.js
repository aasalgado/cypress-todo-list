describe('Smoke test', () => { // Grouping tests, and calling group Smoke test
    beforeEach(() => { // hook, runs before all test
        cy.request('GET', '/api/todos')
        .its('body') // gets body value
        .each(todo => cy.request('DELETE', `/api/todos/${todo.id}`)) // clear list
    })

    context('With no todos', () => { // smaller group of tests, called With no todos
        it.only('Saves new todos', () => { // test case called Saves new todos
            const items = [
                {text: 'Buy milk', expectedLength: 1},
                {text: 'Buy eggs', expectedLength: 2},
                {text: 'Buy bread', expectedLength: 3},
            ]
            cy.visit('/') // visit url
            cy.server() // Start a server to begin routing responses
            cy.route('POST', '/api/todos') // matching the route to a specific method 
            .as('create') // assigning an alias for later use

            cy.wrap(items)
                .each(todo => {
                cy.focused() // get's the DOM element that is currently focused
                    .type(todo.text) // enters Buy Milk in the input
                    .type('{enter}') // submits enter
                cy.wait('@create') // waiting for response before moving on

                cy.get('.todo-list li') // get method grabs elements by it attributes
                    .should('have.length', todo.expectedLength) // creates an assertion,  in this case checks for the length of todo list
            })
        })
    })

    context('With active todos', () => {
        beforeEach(() => {
          cy.fixture('todos')
            .each(todo => { // loading active todos
              const newTodo = Cypress._.merge(todo, {isComplete: false})
              cy.request('POST', '/api/todos', newTodo)
            })
          cy.visit('/')
        })
    
        it('Loads existing data from the DB', () => {
          cy.get('.todo-list li')
            .should('have.length', 4)
        })
    
        it.only('Deletes todos', () => {
          cy.server()
          cy.route('DELETE', '/api/todos/*') // endpoint for delete includes id so we use a * as a wildcard
            .as('delete')
    
          cy.get('.todo-list li')
            .each($el => {
              cy.wrap($el)
                .find('.destroy') // find child button with class destroy
                .invoke('show') // css hides it until user hovers over it so we have to force it to show
                .click()
    
              cy.wait('@delete') // wait for the delete call
            })
            .should('not.exist')
        })
    
      it.only('Toggles todos', () => {
        const clickToggleAndWait = ($el) => {
          cy.wrap($el)
            .as('item')
            .find('.toggle')
            .click()
    
          cy.wait('@update')
        }
        cy.server()
        cy.route('PUT', '/api/todos/*')
          .as('update')
    
        cy.get('.todo-list li')
          .each($el => {
            clickToggleAndWait($el)
            cy.get('@item')
              .should('have.class', 'completed')
          })
          .each($el => {
            clickToggleAndWait($el)
            cy.get('@item')
              .should('not.have.class', 'completed')
          })
        })
      })
    })
