const NotaComponent = require('./NotaComponent');

class NotaIndividual extends NotaComponent {
  constructor(valor) {
    super();
    this.valor = valor;
  }

  getValor() {
    return this.valor;
  }
}

module.exports = NotaIndividual;
