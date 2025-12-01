const NotaComponent = require('./NotaComponent');

class GrupoNotas extends NotaComponent {
  constructor(nombreGrupo) {
    super();
    this.nombreGrupo = nombreGrupo;
    this.notas = [];
  }

  agregarNota(notaComponent) {
    this.notas.push(notaComponent);
  }

  getValor() {
    if (this.notas.length === 0) return 0;

    const total = this.notas.reduce((sum, nota) => sum + nota.getValor(), 0);
    return total / this.notas.length;
  }
}

module.exports = GrupoNotas;
