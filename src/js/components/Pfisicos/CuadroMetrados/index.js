import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import axios from "axios";
import { Nav, NavItem, NavLink, Button, CardHeader } from "reactstrap";
import classnames from "classnames";
import { UrlServer } from "../../Utils/ServerUrlConfig";
import { mesesShort, Redondea } from "../../Utils/Funciones";
import "./CuadroMetrados.css";
export default () => {
  useEffect(() => {
    fetchAnyos();
  }, []);
  //get data de anyos
  const [Anyos, setAnyos] = useState([]);
  async function fetchAnyos() {
    var request = await axios.post(`${UrlServer}/getHistorialAnyos2`, {
      id_ficha: sessionStorage.getItem("idobra"),
    });
    setAnyos(request.data);
    var ultimoAnyo = request.data[request.data.length - 1].anyo;
    setAnyoSeleccionado(ultimoAnyo);
  }
  const [AnyoSeleccionado, setAnyoSeleccionado] = useState(0);

  //get data de meses
  const [Meses, setMeses] = useState([]);
  async function fetchMeses() {
    var res = await axios.post(`${UrlServer}/getHistorialMeses2`, {
      id_ficha: sessionStorage.getItem("idobra"),
      anyo: AnyoSeleccionado,
    });
    setMeses(res.data);
    if (res.data.length) setMesSeleccionado(res.data[res.data.length - 1].mes);
  }
  const [MesSeleccionado, setMesSeleccionado] = useState(0);
  //get data de componentes
  const [Componentes, setComponentes] = useState([]);
  async function fetchComponentes() {
    var res = await axios.post(`${UrlServer}/getHistorialComponentes2`, {
      id_ficha: sessionStorage.getItem("idobra"),
      anyo: AnyoSeleccionado,
      mes: MesSeleccionado,
    });
    setComponentes(res.data);
    if (res.data.length) {
      console.log(
        "componente seleccionado",
        res.data[res.data.length - 1].id_componente
      );
      setComponenteSeleccionado(res.data[res.data.length - 1]);
    }
  }
  const [ComponenteSeleccionado, setComponenteSeleccionado] = useState(0);
  //avances
  const [Avances, setAvances] = useState([]);
  async function fetchAvances() {
    var res = await axios.get(`${UrlServer}/v1/avance/cuadroMetrados`, {
      params: {
        anyo: AnyoSeleccionado,
        mes: MesSeleccionado,
        id_componente: ComponenteSeleccionado.id_componente,
      },
    });
    setAvances(res.data);
  }
  async function fetchAvancesResumen() {
    var res = await axios.get(`${UrlServer}/v1/avance/cuadroMetradosResumen`, {
      params: {
        anyo: AnyoSeleccionado,
        mes: MesSeleccionado,
        id_componente: ComponenteSeleccionado.id_componente,
      },
    });
    setAvances(res.data);
  }
  const [MostrarCompleto, setMostrarCompleto] = useState(true);
  useEffect(() => {
    fetchMeses();
  }, [AnyoSeleccionado]);
  useEffect(() => {
    fetchComponentes();
  }, [MesSeleccionado]);
  useEffect(() => {
    if (
      AnyoSeleccionado &&
      MesSeleccionado &&
      ComponenteSeleccionado.id_componente
    ) {
      if (MostrarCompleto) {
        fetchAvances();
      } else {
        fetchAvancesResumen();
      }
    }
  }, [MesSeleccionado, ComponenteSeleccionado, MostrarCompleto]);
  function renderMesesCabezera() {
    var render = [];
    if (Avances && Avances[0]) {
      var properties = Object.keys(Avances[0]).filter((element) =>
        element.startsWith("dia_")
      );
      for (let index = 0; index < properties.length; index++) {
        const key = properties[index];
        var date = new Date(
          AnyoSeleccionado,
          MesSeleccionado - 1,
          key.split("_")[1]
        );
        var esDomingo = date.getDay() == 0;
        var esSabado = date.getDay() == 6;
        render.push(<th style={{ minWidth: "27px" }}>{key.split("_")[1]}</th>);
      }
    }
    return render;
  }
  function renderMesesBody(item) {
    var render = [];
    if (Avances && Avances[0]) {
      var properties = Object.keys(item).filter((element) =>
        element.startsWith("dia_")
      );
      var total = 0;
      for (let index = 0; index < properties.length; index++) {
        const key = properties[index];
        var date = new Date(
          AnyoSeleccionado,
          MesSeleccionado - 1,
          key.split("_")[1]
        );
        var esDomingo = date.getDay() == 0;
        var esSabado = date.getDay() == 6;
        render.push(
          <td
            style={
              esDomingo
                ? { background: "#97999a" }
                : esSabado
                ? { background: "#cdd1d4" }
                : {}
            }
          >
            {item[key] == 0 ? "" : item[key]}
          </td>
        );
        total += item[key];
      }
      render.push(<td>{total == 0 ? "" : Redondea(total)}</td>);
      render.push(<td>{Redondea(item.metrado - total)}</td>);
    }
    return render;
  }

  return (
    <div>
      <Nav tabs>
        <NavItem>
          <select
            value={AnyoSeleccionado}
            className="form-control form-control-sm"
            onChange={(e) => setAnyoSeleccionado(e.target.value)}
          >
            {Anyos.map((item, i) => (
              <option key={i} value={item.anyo}>
                {item.anyo}
              </option>
            ))}
          </select>
        </NavItem>
        {Meses.map((item, i) => (
          <NavItem key={i}>
            <NavLink
              className={classnames({ active: item.mes == MesSeleccionado })}
              onClick={() => {
                setMesSeleccionado(item.mes);
              }}
            >
              {mesesShort[item.mes - 1]}
            </NavLink>
          </NavItem>
        ))}
        <Button
          onClick={() => setMostrarCompleto(!MostrarCompleto)}
          color="primary"
        >
          {MostrarCompleto ? "Resumen" : "Completo"}
        </Button>
      </Nav>
      <Nav tabs>
        {Componentes.map((item, i) => (
          <NavItem key={i}>
            <NavLink
              className={classnames({
                active:
                  item.id_componente == ComponenteSeleccionado.id_componente,
              })}
              onClick={() => setComponenteSeleccionado(item)}
            >
              C-{item.numero}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <CardHeader>
        {ComponenteSeleccionado.numero +
          " " +
          ComponenteSeleccionado.nombre_componente}
      </CardHeader>
      <div style={{ overflowX: "auto" }}>
        <table className="whiteThem-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th>DESCRIPCION</th>
              <th>METRADO ANTERIOR</th>
              {renderMesesCabezera()}
              <th>TOTAL</th>
              <th>SALDO</th>
            </tr>
          </thead>
          <tbody>
            {Avances.map((item, i) => (
              <tr key={i} style={{ whiteSpace: "nowrap" }}>
                <td>{item.item}</td>
                <td>{item.descripcion}</td>
                <td>
                  {item.metrado &&
                    Redondea(item.metrado) + " " + item.unidad_medida}
                </td>
                {renderMesesBody(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
