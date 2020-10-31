import React, { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Label, Input } from 'reactstrap';
import { DebounceInput } from 'react-debounce-input';
import { Redondea, mesesShort } from './../../../Utils/Funciones';
import axios from 'axios';
import { UrlServer } from '../../../Utils/ServerUrlConfig';
import { Line } from 'react-chartjs-2';
import { FaList, FaChartLine } from "react-icons/fa";
import { MdSave, MdClose, MdModeEdit } from "react-icons/md";

function Curva_S({ id_ficha }) {
    function getMesfromDate(date) {
        date = date.split("-")
        return Number(date[1])
    }
    function getAnyofromDate(date) {
        date = date.split("-")
        return Number(date[0])
    }
    function mesActual() {
        var fecha = new Date();

        var anio = fecha.getFullYear();
        var mes = fecha.getMonth() + 1;
        var dia = fecha.getDate();


        if (dia < 10) {
            dia = "0" + dia
        }
        if (mes < 10) {
            mes = "0" + mes
        }

        return anio + '-' + mes
    }
    function anyoMesActual() {
        var fecha = new Date()

        var anio = fecha.getFullYear();
        var mes = fecha.getMonth() + 1;
        var dia = fecha.getDate();


        if (dia < 10) {
            dia = "0" + dia
        }
        if (mes < 10) {
            mes = "0" + mes
        }

        return anio + '-' + mes
    }
    function anyoMes(dateText) {
        var anyoMes = dateText.substring(0, 7)
        return anyoMes
    }
    // modal
    const [modal, setModal] = useState(false);
    const toggle = () => setModal(!modal);
    //datas por defecto
    useEffect(() => {
        fetchDataCurvaS()
        fetchAnyosEjecutados()
    }, []);
    //modal data
    const [MesesModal, setMesesModal] = useState([]);
    function addMesModal() {
        var dataClonado = [...MesesModal]
        dataClonado.push(
            {
                "fecha_inicial": "2020-10-10",
                "programado_monto": 0,
                "financiero_monto": 0,
                "ejecutado_monto": 0,
                "observacion": "",
                "estado_codigo": "E",
                "fichas_id_ficha": sessionStorage.getItem('idobra'),
            },
        )
        setMesesModal(dataClonado);
    }
    function onChangeModalData(value, name, i) {
        var Dataclonado = [...MesesModal]
        Dataclonado[i][name] = value
        if (name == "anyoMes") {
            Dataclonado[i].fecha_inicial = value + "-01"
        }
        setMesesModal(Dataclonado)
    }
    async function saveModalData() {
        if (PeriodosEjecutados.length > 0) {
            const request = await axios.post(`${UrlServer}/postDataCurvaS`, PeriodosEjecutados)
            alert(request.data.message)
        }

        if (MesesModal.length > 0) {
            //seccion de mesesmodal
            const request2 = await axios.post(`${UrlServer}/postDataCurvaS`, MesesModal)
            alert(request2.data.message)
        }
        setModal(false)
        fetchDataCurvaS()

    }
    //data de curva s
    const [DataCurvaS, setDataCurvaS] = useState([]);
    async function fetchDataCurvaS() {
        const request = await axios.post(`${UrlServer}/getDataCurvaS`,
            {
                "id_ficha": id_ficha
            }
        )
        //actualizacion de monto ejecutado
        for (let i = 0; i < request.data.length; i++) {
            const element = request.data[i];
            console.log("foreach");
            console.log(anyoMes(element.fecha_inicial), anyoMesActual());
            if (anyoMes(element.fecha_inicial) == anyoMesActual()) {
                console.log("fecha_inicial", element.fecha_inicial, i);
                var ejecutado_monto = await updateEjecutado(element.fecha_inicial)
                console.log("ejecutado monto actualizado", ejecutado_monto);
                element.ejecutado_monto = ejecutado_monto
                break;
            }
        }

        setDataCurvaS(request.data)
        createDataChart(request.data)
    }
    //cargar anyos data select
    const [AnyosEjecutados, setAnyosEjecutados] = useState([]);
    const [AnyoSeleccionado, setAnyoSeleccionado] = useState(0);
    async function fetchAnyosEjecutados() {
        const request = await axios.post(`${UrlServer}/getAnyosEjecutados`,
            {
                "id_ficha": id_ficha
            }
        )
        setAnyosEjecutados(request.data)
        fetchPeriodosEjecutados(request.data[request.data.length - 1].anyo)
        setAnyoSeleccionado(request.data[request.data.length - 1].anyo)
    }
    //periodos ejecutados
    const [PeriodosEjecutados, setPeriodosEjecutados] = useState([]);
    async function fetchPeriodosEjecutados(anyo) {
        const request = await axios.post(`${UrlServer}/getPeriodosEjecutados`,
            {
                "id_ficha": id_ficha,
                "anyo": anyo
            }
        )
        //procesamiento
        var tempData = request.data.data
        tempData.forEach(element => {
            element.programado_monto = element.ejecutado_monto
            element.financiero_monto = 0
            element.observacion = ""
            element.fichas_id_ficha = sessionStorage.getItem('idobra')
        });
        setPeriodosEjecutados(tempData)
    }
    function onChangePeriodosData(value, name, i) {
        var Dataclonado = [...PeriodosEjecutados]
        Dataclonado[i][name] = value
        setPeriodosEjecutados(Dataclonado)
    }
    function onChangeAnyo(value) {
        fetchPeriodosEjecutados(value)
        setAnyoSeleccionado(value)
    }
    //actualizar monto ejecutado
    async function updateEjecutado(fecha_inicial) {
        const request = await axios.post(`${UrlServer}/putEjecutadoMonto`,
            {
                "fecha_inicial": fecha_inicial,
                "id_ficha": id_ficha
            }
        )
        return request.data.ejecutado_monto
    }
    //chart
    const [DataChart, setDataChart] = useState({});
    function createDataChart(dataCurvaS) {
        console.log("dataCurvaS", dataCurvaS);
        var labels = []
        var programado = []
        var ejecutado = []
        var financiero = []

        dataCurvaS.forEach((item, i) => {
            var label = mesesShort[getMesfromDate(item.fecha_inicial) - 1] + " - " + getAnyofromDate(item.fecha_inicial)
            labels.push(label)
            programado.push(item.programado_monto)
            ejecutado.push(item.ejecutado_monto)
            financiero.push(item.financiero_monto)
        })
        const cumulativeSum = (sum => value => sum += value)(0);
        const cumulativeSum2 = (sum => value => sum += value)(0);
        const cumulativeSum3 = (sum => value => sum += value)(0);
        financiero = financiero.map(cumulativeSum);
        programado = programado.map(cumulativeSum2);
        ejecutado = ejecutado.map(cumulativeSum3);
        setDataChart({
            labels: labels,
            datasets: [
                {
                    label: 'PROGRAMADO',
                    data: programado,

                    backgroundColor: "#0080ff",
                    borderColor: "#0080ff",
                    fill: false,
                }
                ,
                {
                    label: 'EJECUTADO',
                    data: ejecutado,
                    backgroundColor: "#fd7e14",
                    borderColor: "#fd7e14",
                    fill: false,
                }
                ,
                {
                    label: 'FINANCIERO',
                    data: financiero,
                    backgroundColor: "#ffc107",
                    borderColor: "#ffc107",
                    fill: false,
                }
            ]
        });


    }
    //update financiero 
    async function updateFinanciero(id, i) {
        const request = await axios.post(`${UrlServer}/putFinancieroCurvaS`,
            {
                "id": id,
                "financiero_monto": ValueInputFinanciero[i]
            })
        console.log(request.data)
        fetchDataCurvaS()
        toggleInputFinanciero(-1)
    }
    const [EstadoInputFinanciero, setEstadoInputFinanciero] = useState(-1);
    function toggleInputFinanciero(index) {
        console.log("toggleInputFinanciero", index);
        setEstadoInputFinanciero(index);
    }
    const [ValueInputFinanciero, setValueInputFinanciero] = useState([]);
    function onChangeInputFinanciero(value, i) {
        var dataTemp = [...ValueInputFinanciero]
        dataTemp[i] = value
        setValueInputFinanciero(dataTemp)
    }


    return (
        <div>
            <div style={{
                // position: "relative",
                overflowY: "auto"
            }}>

                <Line data={DataChart} />
                <Button color="danger" onClick={toggle}>+</Button>
                <table className="table table-sm small">
                    <thead>
                        <tr>
                            <th>
                                MES
                        </th>
                            {
                                DataCurvaS.map((item, i) =>
                                    <th key={i}>
                                        {item.estado_codigo == 'C' ? "CORTE " : ""}
                                        {mesesShort[getMesfromDate(item.fecha_inicial) - 1]} - {getAnyofromDate(item.fecha_inicial)}
                                    </th>
                                )
                            }

                        </tr>
                    </thead>
                    <tbody>
                        <tr >
                            <th>
                                PROGRAMADO
                        </th>
                            {
                                DataCurvaS.map((item, i) =>
                                    <td key={i}>{Redondea(item.programado_monto)}</td>
                                )
                            }
                        </tr>
                        <tr >
                            <th>
                                EJECUTADO
                        </th>
                            {
                                DataCurvaS.map((item, i) =>
                                    <td key={i}>{Redondea(item.ejecutado_monto)}</td>
                                )
                            }
                        </tr>
                        <tr >
                            <th>
                                FINANCIERO
                        </th>
                            {
                                DataCurvaS.map((item, i) =>
                                    <td key={i}>
                                        <div>
                                            {
                                                EstadoInputFinanciero == i ?

                                                    <div
                                                        className="d-flex"
                                                    >
                                                        <DebounceInput
                                                            value={item.financiero_monto}
                                                            debounceTimeout={300}
                                                            onChange={e => onChangeInputFinanciero(e.target.value, i)}
                                                            type="number"
                                                        />
                                                        <div
                                                            onClick={() => updateFinanciero(item.id, i)}
                                                        >
                                                            <MdSave />
                                                        </div>
                                                        <div
                                                            onClick={() => toggleInputFinanciero(-1)}
                                                        >
                                                            <MdClose />
                                                        </div>
                                                    </div>
                                                    :
                                                    <div
                                                        className="d-flex"
                                                    >
                                                        {Redondea(item.financiero_monto)}
                                                        <div
                                                            onClick={() => toggleInputFinanciero(i)}
                                                        >
                                                            <MdModeEdit />
                                                        </div>
                                                    </div>
                                            }
                                        </div>
                                    </td>
                                )
                            }
                        </tr>
                    </tbody>
                </table>

            </div>


            <Modal isOpen={modal} toggle={toggle} >
                <ModalHeader toggle={toggle}>Modal title</ModalHeader>
                <ModalBody>
                    <Input type="select"
                        value={AnyoSeleccionado}
                        onChange={e => onChangeAnyo(e.target.value)}
                        className="form-control"
                    >
                        <option disabled hidden>SELECCIONE</option>
                        {
                            AnyosEjecutados.map((item, i) =>
                                <option key={i}>{item.anyo}</option>
                            )
                        }

                    </Input>
                    <table>
                        <thead>
                            <tr>
                                <th>mes</th>
                                <th>programado</th>
                                <th>ejecutado</th>
                                <th>financiero</th>
                                <th>observacion</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                PeriodosEjecutados.map((item, i) =>
                                    <tr key={i}>
                                        <td>
                                            {item.estado_codigo == "C" ?
                                                "CORTE-" : ""
                                            }{mesesShort[item.mes - 1]}
                                        </td>
                                        <td>{Redondea(item.programado_monto)}</td>
                                        <td>{Redondea(item.ejecutado_monto)}</td>
                                        <td><DebounceInput
                                            value={item.financiero_monto}
                                            debounceTimeout={300}
                                            onChange={e => onChangePeriodosData(e.target.value, "financiero_monto", i)}
                                            type="number"
                                            className="form-control"
                                        />
                                        </td>
                                        <td><DebounceInput
                                            value={item.observacion}
                                            debounceTimeout={300}
                                            onChange={e => onChangePeriodosData(e.target.value, "observacion", i)}
                                            type="text"
                                            className="form-control"
                                        /></td>

                                    </tr>

                                )

                            }

                            {
                                MesesModal.map((item, i) =>
                                    <tr key={i}>
                                        <td>
                                            <DebounceInput
                                                value={item.anyoMes}
                                                debounceTimeout={300}
                                                onChange={e => onChangeModalData(e.target.value, "anyoMes", i)}
                                                type="month"
                                                min={mesActual()}
                                                className="form-control"
                                            />
                                        </td>

                                        <td><DebounceInput
                                            value={item.programado_monto}
                                            debounceTimeout={300}
                                            onChange={e => onChangeModalData(e.target.value, "programado_monto", i)}
                                            type="number"
                                            className="form-control"
                                        /></td>
                                        <td>{item.ejecutado}</td>
                                        <td><DebounceInput
                                            value={item.financiero_monto}
                                            debounceTimeout={300}
                                            onChange={e => onChangeModalData(e.target.value, "financiero_monto", i)}
                                            type="number"
                                            className="form-control"
                                        /></td>
                                        <td><DebounceInput
                                            value={item.observacion}
                                            debounceTimeout={300}
                                            onChange={e => onChangeModalData(e.target.value, "observacion", i)}
                                            type="text"
                                            className="form-control"
                                        /></td>

                                    </tr>

                                )
                            }
                            <tr>
                                <td colSpan={5}></td>
                                <td>
                                    <Button color="danger" onClick={addMesModal}>+</Button>
                                </td>
                            </tr>

                        </tbody>

                    </table>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={saveModalData}>Guardar</Button>{' '}
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </div >
    );
}
export default Curva_S