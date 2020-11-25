import React, { Component } from 'react';
import axios from 'axios';
import { DebounceInput } from 'react-debounce-input';
import { FaPlus, FaCheck, FaSuperpowers, FaFilter, FaCircle } from 'react-icons/fa';
import { MdFlashOn, MdClose, MdPerson, MdSearch, MdComment, MdFirstPage, MdLastPage, MdChevronLeft, MdChevronRight, MdVisibility, MdMonetizationOn, MdWatch, MdLibraryBooks, MdAddAPhoto } from 'react-icons/md';
import { TiWarning } from "react-icons/ti";

import { InputGroupAddon, InputGroupText, CustomInput, InputGroup, Spinner, Nav, NavItem, NavLink, Card, CardHeader, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, InputGroupButtonDropdown, Input, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledPopover, PopoverHeader, PopoverBody, Table } from 'reactstrap';
import classnames from 'classnames';

import { toast } from "react-toastify";
import * as Icos from './index';

import LogoSigobras from './../../../../../../images/logoSigobras.png'
import { UrlServer } from '../../../../Utils/ServerUrlConfig';
import { ConvertFormatStringNumber, PrimerDiaDelMesActual, FechaActual } from '../../../../Utils/Funciones'
import Comentarios from './Comentarios';
import { socket } from "../../../../Utils/socket";
class MetradosDiarios extends Component {
    state = {
        DataComponentes: [],
        DataPartidas: [],
        DataActividades: [],
        DataMayorMetrado: [],
        DataPrioridadesApi: [],
        DataIconosCategoriaApi: [],
        activeTab: '0',
        modal: false,
        modalMm: false,
        nombreComponente: '',
        CargandoComp: true,
        // creo que son data de imputs
        ValorMetrado: '',
        DescripcionMetrado: '',
        ObservacionMetrado: '',
        IdMetradoActividad: '',
        debounceTimeout: 500,

        // datos para capturar en el modal
        id_actividad: '',
        nombre_actividad: '',
        unidad_medida: '',
        costo_unitario: '',
        actividad_metrados_saldo: '',
        indexComp: '',
        actividad_porcentaje: '',
        actividad_avance_metrado: '',
        metrado_actividad: '',
        viewIndex: '',
        parcial_actividad: '',
        descripcion: '',
        metrado: '',
        porcentaje_negatividad: 0,
        rendimiento: null,
        // registrar inputs de mayores metrados
        nombre: '',
        veces: '',
        largo: '',
        ancho: '',
        alto: '',
        parcialMM: 0,
        tipo: '',
        partidas_id_partida: '',

        // validacion de al momento de metrar
        smsValidaMetrado: '',
        parcial: '',
        // cargar imagenes
        file: null,
        UrlImagen: "",
        SMSinputTypeImg: false,

        // funciones de nueva libreria
        dropdownOpen: false,
        collapse: 2599,
        id_componente: '',
        indexPartida: 0,
        OpcionMostrarMM: '',
        mostrarIconos: null,
        mostrarColores: null,
        // filtrador
        BuscaPartida: null,
        FilterSelected: "% Avance",

        // captura de la fecha
        fecha_actualizacion: '',
        // demos  iconos-----------------
        iconos: [<MdMonetizationOn />, <MdVisibility />, <MdWatch />, <TiWarning />, <MdLibraryBooks />, <FaSuperpowers />],

        dataFiltrada: [],

        modalImgPartida: false,
        // ENVIO DE FORMULARIO DE IMAGEN DINAMICO
        Id_Partida_O_Actividad: null,
        EnvioImgObsApiRuta: null,

        // DATA PARA PAGINACION 
        PaginaActual: 1,
        CantidadRows: 40,
        modalComentarios: false,
        PartidaSeleccionada: null,
        id_partidaSeleccionada: 1000,

        //comentarios
        partidaComentarios: [],
        componentesComentarios: []
    }
    async componentDidMount() {
        document.title = "Metrados Diarios"
        await axios.post(`${UrlServer}${this.props.rutas.Componentes}`, {
            id_ficha: sessionStorage.getItem('idobra')
        })
            .then((res) => {
                if (res.data !== "vacio") {
                    this.setState({
                        DataComponentes: res.data,
                        nombreComponente: res.data[0].nombre,
                        id_componente: res.data[0].id_componente
                    })
                    this.getPartidas(res.data[0].id_componente);
                }
            })
            .catch(() => {
                toast.error('No es posible conectar al sistema. Comprueba tu conexión a internet.', { position: "top-right", autoClose: 5000 });
            })
            .finally(() => {
                this.setState({
                    CargandoComp: false
                })
            })
        this.getComponentesComentarios()

        // axios consulta al api de  prioridades ====================================
        axios.get(`${UrlServer}/getPrioridades`)
            .then((res) => {
                this.setState({
                    DataPrioridadesApi: res.data
                })
            })
            .catch((err) => {
                console.log("errores al realizar la peticion de prioridades", err);

            })
        // axios consulta al api de  prioridades ====================================

        axios.get(`${UrlServer}/getIconoscategorias`)
            .then((res) => {
                var CategoriasIconos = res.data
                CategoriasIconos.forEach(ico => {
                    var iconoA = ico.nombre.split('<').join("")
                    var iconoB = iconoA.split('/>').join("")

                    Object.assign(ico, { icono: iconoB })
                    if (ico.nombre === "<FaSuperpowers/>") {
                        ico.nombre = <FaSuperpowers />
                    } else if (ico.nombre === "<MdLibraryBooks/>") {
                        ico.nombre = <MdLibraryBooks />
                    } else if (ico.nombre === "<TiWarning/>") {
                        ico.nombre = <TiWarning />
                    } else if (ico.nombre === "<MdWatch/>") {
                        ico.nombre = <MdWatch />
                    } else if (ico.nombre === "<MdVisibility/>") {
                        ico.nombre = <MdVisibility />
                    } else if (ico.nombre === "<MdMonetizationOn/>") {
                        ico.nombre = <MdMonetizationOn />
                    }
                });
                this.setState({
                    DataIconosCategoriaApi: CategoriasIconos
                })
            })
            .catch((err) => {
                console.log("errores al realizar la peticion de iconos", err);
            })
        this.getDataSocketComponente()
    }
    getDataSocketComponente() {
        // sockets
        socket.on("partidas_comentarios_notificacion_get-" + this.state.id_componente, (data) => {
            console.log("llegada de mensaje idcomponente");
            this.getCantidadComentarios(this.state.id_componente)
        })
        socket.on("componentes_comentarios_notificacion_get-" + sessionStorage.getItem('idobra'), (data) => {
            console.log("llegada de mensaje idobra");
            this.getComponentesComentarios()
        })
    }
    async getComponentesComentarios() {
        var req_componentesComentario = await axios.post(`${UrlServer}/getComponentesComentarios`, {
            "id_acceso": sessionStorage.getItem('idacceso'),
            "id_ficha": sessionStorage.getItem('idobra'),
        })
        console.log("req_componentesComentario", req_componentesComentario.data);
        this.setState({ componentesComentarios: req_componentesComentario.data })
    }
    async Tabs(tab, id_componente, nombComp) {
        if (this.state.activeTab !== tab) {
            await this.setState({
                activeTab: tab,
                nombreComponente: nombComp,
                DataPartidas: [],
                id_componente,
                collapse: -1,
                BuscaPartida: null,
                PaginaActual: 1
            });
        }
        this.getPartidas(id_componente)
        this.getDataSocketComponente()
    }
    async getPartidas(id_componente) {
        // get partidas -----------------------------------------------------------------
        var partidas_request = await axios.post(`${UrlServer}${this.props.rutas.Partidas}`, {
            id_componente: id_componente
        })
        console.log('getPartidas>>', partidas_request.data);
        var partidas = partidas_request.data
        // seteando la data que se me envia del api- agrega un icono
        for (let i = 0; i < partidas.length; i++) {
            // console.log("partida",  partidas[i].iconocategoria_nombre)
            var iconoA = partidas[i].iconocategoria_nombre.split('<').join("")
            var iconoB = iconoA.split('/>').join("")

            Object.assign(partidas[i], { icono: iconoB })
            if (partidas[i].iconocategoria_nombre === "<FaSuperpowers/>") {
                partidas[i].iconocategoria_nombre = <FaSuperpowers />
            } else if (partidas[i].iconocategoria_nombre === "<MdLibraryBooks/>") {
                partidas[i].iconocategoria_nombre = <MdLibraryBooks />
            } else if (partidas[i].iconocategoria_nombre === "<TiWarning/>") {
                partidas[i].iconocategoria_nombre = <TiWarning />
            } else if (partidas[i].iconocategoria_nombre === "<MdWatch/>") {
                partidas[i].iconocategoria_nombre = <MdWatch />
            } else if (partidas[i].iconocategoria_nombre === "<MdVisibility/>") {
                partidas[i].iconocategoria_nombre = <MdVisibility />
            } else if (partidas[i].iconocategoria_nombre === "<MdMonetizationOn/>") {
                partidas[i].iconocategoria_nombre = <MdMonetizationOn />
            } else {
                partidas[i].iconocategoria_nombre = null
            }
        }
        await this.setState({
            DataPartidas: partidas,
        })
        this.getCantidadComentarios(id_componente)
    }
    async getCantidadComentarios(id_componente) {
        //cargando la cantidad de comentarios no vistos
        var partidaComentarios_request = await axios.post(`${UrlServer}/getComponenteComentariosNoVistos`, {
            id_componente: id_componente,
            id_acceso: sessionStorage.getItem('idacceso')
        })
        console.log("partidaComentarios_request", partidaComentarios_request);
        this.setState({
            partidaComentarios: partidaComentarios_request.data
        })
    }
    CapturarID = (id_actividad, nombre_actividad, unidad_medida, costo_unitario, actividad_metrados_saldo, indexComp, actividad_porcentaje, actividad_avance_metrado, metrado_actividad, viewIndex, parcial_actividad, descripcion, metrado, parcial, porcentaje_negativo, rendimiento) => {
        // console.log('porcentaje_negatividad', porcentaje_negativo)
        this.modalMetrar();
        this.setState({
            modal: !this.state.modal,
            id_actividad: id_actividad,
            nombre_actividad: nombre_actividad,
            unidad_medida: unidad_medida,
            costo_unitario: costo_unitario,
            actividad_metrados_saldo: actividad_metrados_saldo,
            indexComp: indexComp,
            actividad_porcentaje: actividad_porcentaje,
            actividad_avance_metrado: actividad_avance_metrado,
            metrado_actividad: metrado_actividad,
            viewIndex: viewIndex,
            parcial_actividad: parcial_actividad,
            descripcion: descripcion,
            smsValidaMetrado: '',
            metrado: metrado,
            parcial: parcial,
            porcentaje_negatividad: porcentaje_negativo,
            rendimiento: rendimiento,
            // limpia valores por si los tiene
            UrlImagen: "",
            file: null,
        })
    }
    modalMetrar = () => {
        this.setState({
            modal: !this.state.modal
        });
    }
    modalMayorMetrado = () => {
        this.setState({
            modalMm: !this.state.modalMm
        });
    }
    onChangeImgMetrado = (e) => {

        var inputValueImg = e.target.files[0]

        if (inputValueImg.type === "image/jpeg" || inputValueImg.type === "image/png" || inputValueImg.type === "image/jpg") {
            // console.log('subir imagen', inputValueImg);
            var url = URL.createObjectURL(inputValueImg)
            // console.log("url", url);

            this.setState({
                file: inputValueImg,
                UrlImagen: url,
                SMSinputTypeImg: false
            });
            return
        }

        this.setState({
            SMSinputTypeImg: true,
            UrlImagen: "",
            file: null
        })
    }
    EnviarMetrado_EJECUCION = (e) => {

        e.preventDefault()

        var { id_actividad, DescripcionMetrado, ObservacionMetrado, ValorMetrado, DataPartidas, DataActividades, actividad_metrados_saldo, indexPartida } = this.state
        var DataModificadoPartidas = DataPartidas
        var DataModificadoActividades = DataActividades
        actividad_metrados_saldo = ConvertFormatStringNumber(actividad_metrados_saldo)

        // funciones  para cargar las imagenes
        const formData = new FormData();
        formData.append('foto', this.state.file);
        formData.append('accesos_id_acceso', sessionStorage.getItem('idacceso'));
        formData.append('codigo_obra', sessionStorage.getItem("codigoObra"));
        formData.append('Actividades_id_actividad', id_actividad);
        formData.append('valor', this.state.ValorMetrado);
        formData.append('descripcion', DescripcionMetrado);
        formData.append('observacion', ObservacionMetrado);

        // formData.append('id_ficha', sessionStorage.getItem('idobra'))

        // console.log("formData", formData);

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };

        if (ValorMetrado === '' || ValorMetrado === '0' || ValorMetrado === NaN) {
            this.setState({ smsValidaMetrado: 'Ingrese un valor de metrado válido' })
        } else if (Number(ValorMetrado) < 0) {
            this.setState({ smsValidaMetrado: 'El valor del metrado es inferior a cero' })
        } else if (Number(ValorMetrado) > actividad_metrados_saldo) {
            this.setState({ smsValidaMetrado: 'El valor del metrado ingresado es mayor al saldo disponible' })
        } else {
            if (confirm('¿Estas seguro de metrar?')) {
                this.setState({
                    modal: !this.state.modal
                })

                // ENVIO DE DATOS NORMAL SIN IMAGEN
                axios.post(`${UrlServer}/avanceActividad`,
                    formData,
                    config
                )
                    .then((res) => {
                        console.log('return datos', res)

                        var partidaSetIcon = res.data.partida
                        var CategoriasIconos = res.data.partida.iconocategoria_nombre
                        // CategoriasIconos.forEach(ico => {
                        if (CategoriasIconos === "<FaSuperpowers/>") {
                            CategoriasIconos = <FaSuperpowers />
                        } else if (CategoriasIconos === "<MdLibraryBooks/>") {
                            CategoriasIconos = <MdLibraryBooks />
                        } else if (CategoriasIconos === "<TiWarning/>") {
                            CategoriasIconos = <TiWarning />
                        } else if (CategoriasIconos === "<MdWatch/>") {
                            CategoriasIconos = <MdWatch />
                        } else if (CategoriasIconos === "<MdVisibility/>") {
                            CategoriasIconos = <MdVisibility />
                        } else if (CategoriasIconos === "<MdMonetizationOn/>") {
                            CategoriasIconos = <MdMonetizationOn />
                        } else {
                            CategoriasIconos = null
                        }

                        partidaSetIcon.iconocategoria_nombre = CategoriasIconos
                        // console.log("CategoriasIconos" , CategoriasIconos);
                        DataModificadoPartidas[indexPartida] = partidaSetIcon
                        DataModificadoActividades = res.data.actividades

                        this.setState({
                            DataPartidas: DataModificadoPartidas,
                            DataActividades: DataModificadoActividades,
                            ValorMetrado: "",
                            DescripcionMetrado: "",
                            ObservacionMetrado: "",
                            file: null

                        })
                        toast.success('Exito! Metrado ingresado');
                    })
                    .catch(() => {
                        toast.error('hubo errores al ingresar el metrado');
                        // console.error('algo salio mal al consultar al servidor ', error)
                    })
            }
        }
    }
    EnviarMetrado_CORTE = (e) => {

        e.preventDefault()

        var { id_actividad, DescripcionMetrado, ObservacionMetrado, DataPartidas, DataActividades, indexPartida } = this.state
        var DataModificadoPartidas = DataPartidas
        var DataModificadoActividades = DataActividades
        // actividad_metrados_saldo =  ConvertFormatStringNumber(actividad_metrados_saldo)


        // funciones  para cargar las imagenes
        const formData = new FormData();
        formData.append('foto', this.state.file);
        formData.append('accesos_id_acceso', sessionStorage.getItem('idacceso'));
        formData.append('codigo_obra', sessionStorage.getItem("codigoObra"));
        formData.append('Actividades_id_actividad', id_actividad);
        formData.append('valor', this.state.ValorMetrado - this.state.actividad_avance_metrado);
        formData.append('descripcion', DescripcionMetrado);
        formData.append('observacion', ObservacionMetrado);

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };

        // if(ValorMetrado === '' || ValorMetrado === '0' || ValorMetrado === NaN ){
        //     this.setState({smsValidaMetrado:'Ingrese un valor de metrado válido'})
        // }else if( Number(ValorMetrado) < 0){
        //     this.setState({smsValidaMetrado:'El valor del metrado es inferior a cero'})
        // }else if(Number(ValorMetrado) > actividad_metrados_saldo){
        //     this.setState({smsValidaMetrado:'El valor del metrado ingresado es mayor al saldo disponible'})
        // }else{
        if (confirm('¿Estas seguro de metrar?')) {
            this.setState({
                modal: !this.state.modal
            })

            // ENVIO DE DATOS NORMAL SIN IMAGEN
            axios.post(`${UrlServer}/avanceActividadCorte`,
                formData,
                config
            )
                .then((res) => {
                    // console.log('return dattos', res)
                    var partidaSetIcon = res.data.partida


                    var CategoriasIconos = res.data.partida.iconocategoria_nombre

                    // CategoriasIconos.forEach(ico => {
                    if (CategoriasIconos === "<FaSuperpowers/>") {
                        CategoriasIconos = <FaSuperpowers />
                    } else if (CategoriasIconos === "<MdLibraryBooks/>") {
                        CategoriasIconos = <MdLibraryBooks />
                    } else if (CategoriasIconos === "<TiWarning/>") {
                        CategoriasIconos = <TiWarning />
                    } else if (CategoriasIconos === "<MdWatch/>") {
                        CategoriasIconos = <MdWatch />
                    } else if (CategoriasIconos === "<MdVisibility/>") {
                        CategoriasIconos = <MdVisibility />
                    } else if (CategoriasIconos === "<MdMonetizationOn/>") {
                        CategoriasIconos = <MdMonetizationOn />
                    } else {
                        CategoriasIconos = null
                    }

                    partidaSetIcon.iconocategoria_nombre = CategoriasIconos

                    // console.log("CategoriasIconos", CategoriasIconos);


                    DataModificadoPartidas[indexPartida] = partidaSetIcon
                    DataModificadoActividades = res.data.actividades

                    this.setState({
                        DataPartidas: DataModificadoPartidas,
                        DataActividades: DataModificadoActividades,

                        ValorMetrado: "",
                        DescripcionMetrado: "",
                        ObservacionMetrado: "",
                        file: null,
                        UrlImagen: ""
                    })
                    toast.success('Exito! Metrado ingresado');
                })
                .catch(() => {
                    toast.error('hubo errores al ingresar el metrado');
                    // console.error('algo salio mal al consultar al servidor ', error)
                })

        }
    }
    EnviarMetrado_ACTUALIZACION = (e) => {

        e.preventDefault()

        var { id_actividad, DescripcionMetrado, ObservacionMetrado, ValorMetrado, DataPartidas, DataActividades, actividad_metrados_saldo, indexPartida, fecha_actualizacion } = this.state
        var DataModificadoPartidas = DataPartidas
        var DataModificadoActividades = DataActividades
        actividad_metrados_saldo = ConvertFormatStringNumber(actividad_metrados_saldo)


        // funciones  para cargar las imagenes
        const formData = new FormData();
        formData.append('foto', this.state.file);
        formData.append('accesos_id_acceso', sessionStorage.getItem('idacceso'));
        formData.append('codigo_obra', sessionStorage.getItem("codigoObra"));
        formData.append('Actividades_id_actividad', id_actividad);
        formData.append('valor', this.state.ValorMetrado);
        formData.append('descripcion', DescripcionMetrado);
        formData.append('observacion', ObservacionMetrado);
        formData.append('fecha', fecha_actualizacion);

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };

        if (ValorMetrado === '' || ValorMetrado === '0' || ValorMetrado === NaN) {
            this.setState({ smsValidaMetrado: 'Ingrese un valor de metrado válido' })
        } else if (Number(ValorMetrado) < 0) {
            this.setState({ smsValidaMetrado: 'El valor del metrado es inferior a cero' })
        } else if (Number(ValorMetrado) > actividad_metrados_saldo) {
            this.setState({ smsValidaMetrado: 'El valor del metrado ingresado es mayor al saldo disponible' })
        } else if (fecha_actualizacion === "") {
            this.setState({ smsValidaFecha: "Ingrese una fecha" })
        } else {
            if (confirm('¿Estas seguro de metrar?')) {

                // ENVIO DE DATOS NORMAL SIN IMAGEN
                axios.post(`${UrlServer}/avanceActividadActualizacion`,
                    formData,
                    config
                )
                    .then((res) => {
                        console.log('return dattos', res.data.partida)

                        if (res.data === "fecha invalida") {
                            this.setState({ smsValidaFecha: "La fecha de su dispositivo se encuentra desactualizado" })

                        } else {


                            var partidaSetIcon = res.data.partida


                            var CategoriasIconos = res.data.partida.iconocategoria_nombre

                            // CategoriasIconos.forEach(ico => {
                            if (CategoriasIconos === "<FaSuperpowers/>") {
                                CategoriasIconos = <FaSuperpowers />
                            } else if (CategoriasIconos === "<MdLibraryBooks/>") {
                                CategoriasIconos = <MdLibraryBooks />
                            } else if (CategoriasIconos === "<TiWarning/>") {
                                CategoriasIconos = <TiWarning />
                            } else if (CategoriasIconos === "<MdWatch/>") {
                                CategoriasIconos = <MdWatch />
                            } else if (CategoriasIconos === "<MdVisibility/>") {
                                CategoriasIconos = <MdVisibility />
                            } else if (CategoriasIconos === "<MdMonetizationOn/>") {
                                CategoriasIconos = <MdMonetizationOn />
                            } else {
                                CategoriasIconos = null
                            }

                            partidaSetIcon.iconocategoria_nombre = CategoriasIconos

                            // console.log("CategoriasIconos" , CategoriasIconos);


                            DataModificadoPartidas[indexPartida] = partidaSetIcon
                            DataModificadoActividades = res.data.actividades

                            this.setState({
                                DataPartidas: DataModificadoPartidas,
                                DataActividades: DataModificadoActividades,
                                modal: !this.state.modal,

                                ValorMetrado: "",
                                DescripcionMetrado: "",
                                ObservacionMetrado: "",
                                smsValidaFecha: "",
                                file: null

                            })
                            toast.success('Exito! Metrado ingresado');
                        }

                    })
                    .catch(() => {
                        toast.error('hubo errores al ingresar el metrado');
                        // console.error('algo salio mal al consultar al servidor ', error)
                    })
            }
        }
    }
    capturaidMM = (partidas_id_partida, indexComp, indexPartida, descripcion) => {
        this.setState({
            modalMm: !this.state.modalMm,
            partidas_id_partida: partidas_id_partida,
            descripcion: descripcion,
            indexComp: indexComp,
            viewIndex: indexPartida,
            OpcionMostrarMM: ''
        })
    }
    EnviarMayorMetrado = (e) => {
        e.preventDefault()

        var { DataPartidas, DataActividades, nombre, veces, largo, ancho, alto, parcialMM, partidas_id_partida, indexPartida, OpcionMostrarMM } = this.state

        var DataModificadoPartidas = DataPartidas
        var DataModificadoActividades = DataActividades

        if (confirm('¿Estas seguro de registar el mayor metrado?')) {
            this.setState({
                modalMm: !this.state.modalMm
            })

            axios.post(`${UrlServer}/postNuevaActividadMayorMetrado`, {
                "nombre": nombre,
                "veces": veces,
                "largo": largo,
                "ancho": ancho,
                "alto": alto,
                "parcial": parcialMM,
                "tipo": OpcionMostrarMM,
                "partidas_id_partida": partidas_id_partida
            })
                .then((res) => {
                    // console.log(res)

                    var partidaSetIcon = res.data.partida


                    var CategoriasIconos = res.data.partida.iconocategoria_nombre

                    // CategoriasIconos.forEach(ico => {
                    if (CategoriasIconos === "<FaSuperpowers/>") {
                        CategoriasIconos = <FaSuperpowers />
                    } else if (CategoriasIconos === "<MdLibraryBooks/>") {
                        CategoriasIconos = <MdLibraryBooks />
                    } else if (CategoriasIconos === "<TiWarning/>") {
                        CategoriasIconos = <TiWarning />
                    } else if (CategoriasIconos === "<MdWatch/>") {
                        CategoriasIconos = <MdWatch />
                    } else if (CategoriasIconos === "<MdVisibility/>") {
                        CategoriasIconos = <MdVisibility />
                    } else if (CategoriasIconos === "<MdMonetizationOn/>") {
                        CategoriasIconos = <MdMonetizationOn />
                    } else {
                        CategoriasIconos = null
                    }

                    partidaSetIcon.iconocategoria_nombre = CategoriasIconos

                    // console.log("CategoriasIconos" , CategoriasIconos);


                    DataModificadoPartidas[indexPartida] = partidaSetIcon
                    DataModificadoActividades = res.data.actividades

                    this.setState({
                        DataPartidas: DataModificadoPartidas,
                        DataActividades: DataModificadoActividades,
                        nombre: '',
                        veces: '',
                        largo: '',
                        ancho: '',
                        alto: '',
                        parcial: '',
                        tipo: '',
                        partidas_id_partida: '',
                    })

                    toast.success('Exito! Metrado mayor metrado registrado al sistema');
                })
                .catch((err) => {
                    toast.error('hubo errores al ingresar el metrado');
                    console.error('algo salio mal al consultar al servidor❌❌ ', err)
                })
        }
    }
    CollapseItem = (valor, id_partida) => {
        console.log("demo entre")
        if (valor !== -1 && id_partida !== -1) {
            let event = valor
            this.setState({
                collapse: this.state.collapse === Number(event) ? -1 : Number(event),
                indexPartida: valor,
                DataActividades: [],
                DataMayorMetrado: []
            });


            // getActividades -----------------------------------------------------------------
            if (event !== this.state.collapse) {
                axios.post(`${UrlServer}${this.props.rutas.Actividades}`, {
                    id_partida: id_partida
                })
                    .then((res) => {
                        // console.log('DataActividades>>', res.data);

                        this.setState({
                            DataActividades: res.data.actividades,
                            DataMayorMetrado: res.data.mayor_metrado
                        })
                    })
                    .catch(() => {
                        toast.error('No es posible conectar al sistema. Comprueba tu conexión a internet.', { position: "top-right", autoClose: 5000 });
                        // console.error('algo salio mal verifique el',error);
                    })
            }

        }
    }
    Filtrador = (e) => {
        // console.log("datos ", e)
        this.setState({
            PaginaActual: 1
        })
        var valorRecibido = e
        if (typeof valorRecibido === "number") {
            this.setState({
                BuscaPartida: valorRecibido,
                mostrarIconos: -1,
                PaginaActual: 1
            })

            switch (valorRecibido) {
                case 101:
                    this.setState({
                        FilterSelected: "% Avance"
                    })
                    break;

                case 0:
                    this.setState({
                        FilterSelected: "0%"
                    })
                    break;

                case 100:
                    this.setState({
                        FilterSelected: "100%"
                    })
                    break;

                case 104:
                    this.setState({
                        FilterSelected: "MM"
                    })
                    break;
                default:
                    this.setState({
                        FilterSelected: "Progreso"
                    })
                    break;
            }
            // console.log("valorRecibido ",valorRecibido)

        } else {
            if (e.target !== undefined) {
                this.setState({
                    BuscaPartida: e.target.value,
                })
            }
            else {
                // console.log("eee", e);
                this.setState({
                    BuscaPartida: e
                })
            }
            // console.log("valorRecibido ",e.target.value)

        }
    }
    toggleDropDown = () => {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }
    Prioridad = (i) => {
        console.log("cambia >>", i)
        this.setState({
            mostrarIconos: this.state.mostrarIconos === i ? -1 : i
        })
    }
    UpdatePrioridadIcono = (idPartida, id_icono, index) => {
        // console.log("index", index);


        axios.put(`${UrlServer}/putIconocategoria`,
            {
                "id_partida": idPartida,
                "id_iconoCategoria": id_icono
            }
        )
            .then((res) => {
                // partidas[index].iconocategoria_nombre = res.data.color
                // console.info("response", res.data)
                var partidas = this.state.DataPartidas
                var CategoriasIconos = res.data.nombre

                // CategoriasIconos.forEach(ico => {
                if (CategoriasIconos === "<FaSuperpowers/>") {
                    CategoriasIconos = <FaSuperpowers />
                } else if (CategoriasIconos === "<MdLibraryBooks/>") {
                    CategoriasIconos = <MdLibraryBooks />
                } else if (CategoriasIconos === "<TiWarning/>") {
                    CategoriasIconos = <TiWarning />
                } else if (CategoriasIconos === "<MdWatch/>") {
                    CategoriasIconos = <MdWatch />
                } else if (CategoriasIconos === "<MdVisibility/>") {
                    CategoriasIconos = <MdVisibility />
                } else if (CategoriasIconos === "<MdMonetizationOn/>") {
                    CategoriasIconos = <MdMonetizationOn />
                } else {
                    CategoriasIconos = null
                }
                // });
                partidas[index].iconocategoria_nombre = CategoriasIconos

                // console.log("CategoriasIconos", CategoriasIconos)
                this.setState({
                    DataPartidas: partidas,
                    mostrarIconos: -1,
                    mostrarColores: index
                })
            })
            .catch((err) => {
                console.error("error", err);
            })
    }
    UpdatePrioridadColor = (idPartida, prioridad, index) => {

        var partidas = this.state.DataPartidas
        // console.log("partidas", idPartida, prioridad, index);

        axios.put(`${UrlServer}/putPrioridad`,
            {
                "id_partida": idPartida,
                "id_prioridad": prioridad
            }
        )
            .then((res) => {
                partidas[index].prioridad_color = res.data.color
                // console.info("response", res)
                this.setState({
                    DataPartidas: partidas,
                    mostrarIconos: -1,
                    mostrarColores: null
                })
            })
            .catch((err) => {
                console.error("error", err);
            })
    }
    clearImg = () => {
        this.setState({
            UrlImagen: "",
            // limpia valores por si los tiene
            file: null,
        })
        document.getElementById("myImage").value = "";
    }
    modalImgPartida = () => {
        this.setState(prevState => ({
            modalImgPartida: !prevState.modalImgPartida,
        }));
    }
    capturaDatosCrearImgPartida = (id_partida, Ruta, variable) => {
        console.log("id_partida", id_partida, "Ruta", Ruta, "variable", variable);

        this.setState({
            // limpia valores por si los tiene
            modalImgPartida: !this.state.modalImgPartida,
            partidas_id_partida: id_partida,
            UrlImagen: "",
            file: null,
            Id_Partida_O_Actividad: variable,
            EnvioImgObsApiRuta: Ruta
        })
    }
    EnviaImgPartida = (e) => {
        e.preventDefault();
        var { partidas_id_partida, file, ObservacionMetrado, Id_Partida_O_Actividad, EnvioImgObsApiRuta } = this.state

        const formData = new FormData();
        formData.append('accesos_id_acceso', sessionStorage.getItem('idacceso'));
        formData.append('codigo_obra', sessionStorage.getItem("codigoObra"));
        formData.append(Id_Partida_O_Actividad, partidas_id_partida);
        formData.append('descripcionObservacion', ObservacionMetrado);
        formData.append('foto', file);


        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };

        if (confirm("¿Esta seguro de guardar la imagen al sistema?")) {
            axios.post(`${UrlServer}${EnvioImgObsApiRuta}`,
                formData,
                config
            )
                .then((res) => {
                    console.log("envio de imagen ", res);
                    if (res.data === "exito") {
                        this.setState({
                            modalImgPartida: false
                        })
                        toast.success("Éxito imagen guardada")
                        return
                    }


                })
                .catch((err) => {
                    console.error("no es bien ", err);
                    toast.error("Error al tratar de guardar la imagen")

                })
            return
        }
    }
    PaginaActual = (event) => {
        // console.log("PaginaActual ", Number(event))
        this.setState({
            PaginaActual: Number(event),
            collapse: -1,
        });
    }
    SelectCantidadRows = (e) => {
        // console.log("SelectCantidadRows ", e.target.value)
        this.setState({ CantidadRows: Number(e.target.value) })
    }
    modalComentarios = () => {
        this.setState(prevState => ({
            modalComentarios: !prevState.modalComentarios
        }));
    }
    async onClickMensajes(metrados) {
        this.setState({
            PartidaSeleccionada: metrados.descripcion,
            id_partidaSeleccionada: metrados.id_partida,
            modalComentarios: true
        })
        await axios.post(`${UrlServer}/postComentariosVistos`, {
            "id_partida": metrados.id_partida,
            "id_acceso": sessionStorage.getItem('idacceso')
        })
        console.log(sessionStorage.getItem('idacceso'));
        console.log("id componentes", this.state.id_componente);
        this.getCantidadComentarios(this.state.id_componente)
        this.getComponentesComentarios()
    }
    render() {
        var { DataPrioridadesApi, DataIconosCategoriaApi, DataComponentes, DataPartidas, DataActividades,
            DataMayorMetrado, debounceTimeout, descripcion, smsValidaMetrado, collapse, rendimiento,
            nombreComponente, OpcionMostrarMM, SMSinputTypeImg, PaginaActual, CantidadRows, CargandoComp, partidaComentarios, componentesComentarios } = this.state
        var restaResultado = this.state.ValorMetrado - this.state.actividad_avance_metrado

        var DatosPartidasFiltrado = DataPartidas
        var BuscaPartida = this.state.BuscaPartida
        if (BuscaPartida !== null) {

            if (typeof BuscaPartida === "number") {
                DatosPartidasFiltrado = DatosPartidasFiltrado.filter((filtrado) => {
                    if (BuscaPartida === 101) {
                        return (filtrado.porcentaje <= 100);
                    } else if (BuscaPartida === 99 && filtrado.tipo !== "titulo" && filtrado.porcentaje !== 0) {
                        return (filtrado.porcentaje <= 99);

                    } else if (BuscaPartida === 100 && filtrado.tipo !== "titulo" && filtrado.porcentaje !== 0) {
                        return (filtrado.porcentaje === 100);

                    } else if (BuscaPartida === 104 && filtrado.tipo !== "titulo") {
                        return (filtrado.mayorMetrado === 1);

                        // filtramos las prioridades color
                    } else if (BuscaPartida === 1) {
                        return (filtrado.prioridad_color === "#f00");

                    } else if (BuscaPartida === 2) {
                        return (filtrado.prioridad_color === "#ffff00");

                    } else if (BuscaPartida === 3) {
                        return (filtrado.prioridad_color === "#00b050");

                    } else if (BuscaPartida === 4) {
                        return (filtrado.prioridad_color === "#0080ff");

                    } else if (BuscaPartida === 5 && filtrado.tipo !== "titulo") {
                        return (filtrado.prioridad_color === "#ffffff");
                    }

                    // filtro de prioridades por icono
                    else if (filtrado.icono === BuscaPartida) {
                        // console.log(">>", filtrado.icono , BuscaPartida);
                        return filtrado.icono === BuscaPartida
                    }



                    // } else {
                    //   console.log(">>>> else ", filtrado.porcentaje , BuscaPartida);

                    //   return filtrado.porcentaje === BuscaPartida
                    // }

                });
            } else {
                BuscaPartida = this.state.BuscaPartida.trim().toLowerCase();
                DatosPartidasFiltrado = DatosPartidasFiltrado.filter((filtrado) => {
                    // console.log(">> demos", BuscaPartida.toLowerCase());
                    return filtrado.descripcion.toLowerCase().match(BuscaPartida) || filtrado.icono.toLowerCase() === BuscaPartida;
                });
            }

        }
        // obtener indices para paginar 
        const indexOfUltimo = PaginaActual * CantidadRows;
        // console.log("INDEX OF ULTIMO ", indexOfUltimo)
        const indexOfPrimero = indexOfUltimo - CantidadRows;
        // console.log("INDEX OF PRIMERO ", indexOfPrimero)
        const DataPartidasPaginada = DatosPartidasFiltrado.slice(indexOfPrimero, indexOfUltimo);

        // numero de paginas hasta ahora
        const NumeroPaginas = [];
        for (let i = 1; i <= Math.ceil(DatosPartidasFiltrado.length / CantidadRows); i++) {
            NumeroPaginas.push(i);
        }

        // console.log("NumeroPaginas ", NumeroPaginas)

        return (
            CargandoComp === true
                ?
                <div className="text-center" > <Spinner color="primary" type="grow" /></div>
                :

                <div>
                    {
                        DataComponentes.length <= 0
                            ?
                            <div className="text-center text-warning" > No hay datos </div>
                            :

                            <Card>
                                <Nav tabs>
                                    {DataComponentes.length === 0 ? <Spinner color="primary" size="sm" /> : DataComponentes.map((comp, indexComp) =>
                                        <NavItem key={indexComp} style={{ position: "relative" }}>
                                            <NavLink className={classnames({ active: this.state.activeTab === indexComp.toString() })} onClick={() => this.Tabs(indexComp.toString(), comp.id_componente, comp.nombre)}>
                                                COMP {comp.numero}
                                            </NavLink>
                                            {componentesComentarios[indexComp] && componentesComentarios[indexComp].mensajes ?
                                                <div style={{
                                                    background: "red",
                                                    borderRadius: "50%",
                                                    textAlign: "center",
                                                    position: "absolute",
                                                    right: "0px",
                                                    top: "-3px",
                                                    padding: "1px 4px",
                                                    zIndex: "20",
                                                    fontSize: "9px",
                                                    fontWeight: "bold",

                                                }}>
                                                    {componentesComentarios[indexComp].mensajes}
                                                </div>
                                                : ""}
                                        </NavItem>
                                    )}
                                </Nav>

                                <Card className="m-1">
                                    <CardHeader className="p-1">
                                        {nombreComponente}
                                        <div className="float-right">
                                            <InputGroup size="sm">
                                                <InputGroupAddon addonType="prepend"><InputGroupText><MdSearch size={19} /> </InputGroupText> </InputGroupAddon>

                                                <Input placeholder="Buscar por descripción" onKeyUp={e => this.Filtrador(e)} />

                                                <InputGroupButtonDropdown addonType="append" isOpen={this.state.dropdownOpen} toggle={this.toggleDropDown}>
                                                    <DropdownToggle caret className="bg-primary">
                                                        {this.state.FilterSelected}
                                                    </DropdownToggle>
                                                    <DropdownMenu >
                                                        <DropdownItem onClick={() => this.Filtrador(101)}>Todo</DropdownItem>
                                                        <DropdownItem onClick={() => this.Filtrador(0)} >0%</DropdownItem>
                                                        <DropdownItem onClick={() => this.Filtrador(100)} >100%</DropdownItem>
                                                        <DropdownItem onClick={() => this.Filtrador(99)}>Progreso</DropdownItem>
                                                        <DropdownItem onClick={() => this.Filtrador(104)}>MM</DropdownItem>
                                                    </DropdownMenu>
                                                </InputGroupButtonDropdown>
                                            </InputGroup>

                                        </div>
                                    </CardHeader>
                                    <CardBody>

                                        <table className="table table-sm">
                                            <thead className="resplandPartida">
                                                <tr>
                                                    <th style={{ width: "39px" }}>
                                                        <Button id="FiltrarPor" type="button" className="py-0 px-1">
                                                            <FaFilter />
                                                        </Button>
                                                        <UncontrolledPopover trigger="click" placement="bottom" target="FiltrarPor">
                                                            <div title="Busqueda por prioridad - color" className="prioridad" onClick={() => this.Prioridad("filtro")}>
                                                                <FaCircle size={17} />
                                                            </div>
                                                            <div title="Busqueda por prioridad - ícono" className="prioridad" onClick={() => this.Prioridad("filtroIcono")}>
                                                                <FaSuperpowers size={17} />
                                                            </div>
                                                            {
                                                                //selecciona circulo para filtrar por color
                                                                this.state.mostrarIconos === "filtro" ?
                                                                    <div
                                                                        style={{
                                                                            background: 'radial-gradient(black, #000000a6)',
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            borderRadius: '50%',
                                                                            top: '0px',
                                                                            position: 'absolute',
                                                                            boxShadow: '1px 1px 6px 4px #545454',
                                                                            left: '-20px'
                                                                        }}>
                                                                        <div className="menuCirculo" style={{ zIndex: "20" }}>
                                                                            {
                                                                                DataPrioridadesApi.map((priori, IPriori) =>
                                                                                    <div className="circleColorFilter" style={{ background: priori.color }} onClick={() => this.Filtrador(priori.valor)} key={IPriori} />
                                                                                )
                                                                            }
                                                                            <div className="circleColorFilter" onClick={() => this.Prioridad("filtro")}>
                                                                                <FaCircle size={15} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    : null
                                                            }

                                                            {// iconos circulares para hacer el filtro segun seleccion de un icono
                                                                this.state.mostrarIconos === "filtroIcono" ?
                                                                    <div
                                                                        style={{
                                                                            background: 'radial-gradient(black, #000000a6)',
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            borderRadius: '50%',
                                                                            top: '0px',
                                                                            position: 'absolute',
                                                                            boxShadow: '1px 1px 6px 4px #545454',
                                                                            left: '-20px'
                                                                        }}>
                                                                        {
                                                                            DataIconosCategoriaApi.map((Icono, IIcono) =>
                                                                                <div className="circleIconoFiltrar" onClick={() => this.Filtrador(Icono.icono)} key={IIcono}>
                                                                                    <span className="spanUbi"> {Icono.nombre} </span>
                                                                                </div>
                                                                            )}
                                                                        <div className="circleIconoFiltrar" onClick={() => this.Prioridad("filtroIcono")}>
                                                                            <span className="spanUbi">  <FaSuperpowers size={17} /> </span>
                                                                        </div>
                                                                    </div>

                                                                    : null
                                                            }

                                                        </UncontrolledPopover>
                                                    </th>
                                                    <th></th>
                                                    <th>ITEM</th>
                                                    <th>DESCRIPCIÓN</th>
                                                    <th>METRADO</th>
                                                    <th>P/U </th>
                                                    <th>P/P </th>
                                                    <th width="20%" >BARRA DE PROGRESO</th>
                                                    <th>  %  </th>
                                                    <th style={{ width: "32px" }}></th>
                                                    {/* <th><MdInsertPhoto size={ 18 } /> </th> */}
                                                </tr>
                                            </thead>

                                            {DataPartidasPaginada.length <= 0 ?
                                                <tbody>
                                                    <tr>
                                                        <td colSpan="8" className="text-center text-warning"> <Spinner color="primary" type="grow" />
                                                        </td>
                                                    </tr>
                                                </tbody> :
                                                DataPartidasPaginada.map((metrados, i) =>
                                                    <tbody key={i} >

                                                        <tr className={metrados.tipo === "titulo" ? "font-weight-bold text-info icoVer" : collapse === i ? "font-weight-light resplandPartida icoVer" : "font-weight-light icoVer"}>
                                                            <td>
                                                                {
                                                                    metrados.tipo === "titulo" ? null :
                                                                        <div title="prioridad" className="prioridad" style={{ color: metrados.prioridad_color }} onClick={() => this.Prioridad(i)}>
                                                                            <span className="h6">{metrados.iconocategoria_nombre}</span>
                                                                            {/* {`${Icos[metrados.icono]}`}
                                      {console.log("icon", Icos)} */}
                                                                        </div>
                                                                }
                                                                {/* map de de colores prioridades */}

                                                                <div className={this.state.mostrarIconos !== i ? "d-none" : "menuCirculo"}>

                                                                    {/* DIV DE CIRCULOS CON ICONO   */}
                                                                    {
                                                                        DataIconosCategoriaApi.map((Icono, IIcono) =>
                                                                            <div className="circleIcono" onClick={() => this.UpdatePrioridadIcono(metrados.id_partida, Icono.id_iconoCategoria, i)} key={IIcono}>
                                                                                <span className="spanUbi"> {Icono.nombre} </span>
                                                                            </div>
                                                                        )
                                                                    }
                                                                </div>

                                                                <div className={this.state.mostrarColores !== i ? "d-none" : "menuCirculo"}>

                                                                    {/* DIV DE CIRCULOS CON COLOR   */}
                                                                    {
                                                                        DataPrioridadesApi.map((priori, IPriori) =>
                                                                            <div className="circleColor" style={{ background: priori.color }} onClick={() => this.UpdatePrioridadColor(metrados.id_partida, priori.id_prioridad, i)} key={IPriori}></div>
                                                                        )
                                                                    }
                                                                </div>


                                                            </td>
                                                            <td>
                                                                {
                                                                    metrados.tipo === "titulo" ? "" :
                                                                        <div
                                                                            className="align-center position-relative"
                                                                            onClick={() => this.onClickMensajes(metrados)}
                                                                        >
                                                                            {partidaComentarios[i] && partidaComentarios[i].mensajes ?
                                                                                <div style={{
                                                                                    background: "red",
                                                                                    borderRadius: "50%",
                                                                                    textAlign: "center",
                                                                                    position: "absolute",
                                                                                    left: "-6px",
                                                                                    top: "1px",
                                                                                    padding: "1px 4px",
                                                                                    zIndex: "20",
                                                                                    fontSize: "9px",
                                                                                    fontWeight: "bold",

                                                                                }}>
                                                                                    {partidaComentarios[i].mensajes}
                                                                                </div>
                                                                                : ""}
                                                                            <div style={{
                                                                                position: "absolute",
                                                                                top: "6px",
                                                                                left: "-13px",
                                                                                zIndex: "10"
                                                                            }}>
                                                                                <MdComment size={17} />
                                                                            </div>
                                                                        </div>
                                                                }
                                                            </td>
                                                            <td className={
                                                                metrados.tipo === "titulo" ?
                                                                    ''
                                                                    :
                                                                    collapse === i ?
                                                                        "tdData1"
                                                                        :
                                                                        metrados.mayorMetrado === 0
                                                                            ?
                                                                            "tdData"
                                                                            :
                                                                            "FondMM tdData"} onClick={metrados.tipo === "titulo" ? () => this.CollapseItem(-1, -1) : () => this.CollapseItem(i, metrados.id_partida)} data-event={i} >
                                                                {metrados.item}
                                                            </td>
                                                            <td>
                                                                {metrados.descripcion}
                                                            </td>
                                                            <td>{metrados.metrado} {metrados.unidad_medida} </td>
                                                            <td>{metrados.costo_unitario}</td>
                                                            <td>{metrados.parcial}</td>
                                                            <td className="small border border-left border-right-0 border-bottom-0 border-top-0" >
                                                                <div className={(metrados.tipo === "titulo" ? 'd-none' : '')}>
                                                                    <div className="clearfix">
                                                                        <span className="float-left text-warning">Avance: {metrados.avance_metrado} {metrados.unidad_medida}</span>
                                                                        <span className="float-right text-warning">S/. {metrados.avance_costo}</span>
                                                                    </div>
                                                                    {/* BARRA DE PROCENTAJE PARTIDAS   */}
                                                                    <div style={{
                                                                        height: '3px',
                                                                        width: '100%',
                                                                        background: '#c3bbbb',
                                                                    }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${metrados.porcentaje}%`,
                                                                                height: '100%',
                                                                                background: metrados.porcentaje > 85 ? '#a4fb01'
                                                                                    : metrados.porcentaje > 30 ? '#0080ff'
                                                                                        : '#ff2e00',
                                                                                transition: 'all .9s ease-in',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="clearfix">
                                                                        <span className="float-left text-info">Saldo: {metrados.metrados_saldo} {metrados.unidad_medida}</span>
                                                                        <span className="float-right text-info">S/. {metrados.metrados_costo_saldo}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">

                                                                {/* {metrados.partida_duracion} */}
                                                                {metrados.porcentaje}
                                                                {
                                                                    metrados.tipo !== "titulo"
                                                                        ?

                                                                        <div className="aprecerIcon">
                                                                            <span className="prioridad iconoTr" onClick={() => this.capturaDatosCrearImgPartida(metrados.id_partida, "/avancePartidaImagen", "Partidas_id_partida")}><MdAddAPhoto size={20} /></span>
                                                                        </div>
                                                                        : ""
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr className={collapse === i ? "resplandPartidabottom" : "d-none"}>
                                                            <td colSpan="8">
                                                                <Collapse isOpen={collapse === i}>
                                                                    <div className="p-1">
                                                                        <div className="row">
                                                                            <div className="col-sm-7 text-info">
                                                                                {metrados.descripcion} <MdFlashOn size={20} className="text-danger" />rendimiento: {metrados.rendimiento} {metrados.unidad_medida}
                                                                            </div>
                                                                            <div className="col-sm-2">
                                                                                {
                                                                                    Number(DataMayorMetrado.mm_avance_costo) > 0 ? 'MAYOR METRADO' : ''
                                                                                }
                                                                            </div>
                                                                            <div className="col-sm-2">
                                                                                {/* datos de mayor metrado ------------------ */}
                                                                                {
                                                                                    Number(DataMayorMetrado.mm_avance_costo) > 0 ?
                                                                                        <div className="small">

                                                                                            <div className="clearfix">
                                                                                                <span className="float-left text-info">Avance {DataMayorMetrado.mm_avance_costo} {metrados.unidad_medida}</span>
                                                                                                <span className="float-right text-info">S/. {DataMayorMetrado.mm_avance_metrado}</span>
                                                                                            </div>

                                                                                            <div>
                                                                                                {DataMayorMetrado.mm_porcentaje} %
                                                                                            <div />
                                                                                            </div>
                                                                                            <div className="clearfix">
                                                                                                <span className="float-left text-info">Saldo:  {DataMayorMetrado.mm_metrados_saldo} {metrados.unidad_medida}</span>
                                                                                                <span className="float-right text-info">S/. {DataMayorMetrado.mm_metrados_costo_saldo}</span>
                                                                                            </div>
                                                                                        </div> : ''
                                                                                }
                                                                            </div>
                                                                            <div className="col-sm-1">
                                                                                <button className="btn btn-outline-danger btn-xs p-1 mb-1 fsize" title="Ingreso de mayores metrados sólo con autorización del supervisor" onClick={() => this.capturaidMM(metrados.id_partida, this.state.id_componente, i, metrados.descripcion)}>MM</button>
                                                                            </div>
                                                                        </div>
                                                                        {/* tabla de partidas para */}
                                                                        <Table className="table-bordered table-sm table-hover">
                                                                            <thead>
                                                                                <tr className="text-center">
                                                                                    <th>ACTIVIDADES</th>
                                                                                    <th>N° VECES</th>
                                                                                    <th>LARGO</th>
                                                                                    <th>ANCHO</th>
                                                                                    <th>ALTO</th>
                                                                                    <th>METRADO</th>
                                                                                    <th>P / U </th>
                                                                                    <th>P / P</th>
                                                                                    <th>AVANCE Y SALDO</th>
                                                                                    <th>METRAR</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {
                                                                                    DataActividades.length <= 0 ? <tr><td colSpan="11" className="text-center"><Spinner color="primary" size="sm" /></td></tr> :
                                                                                        DataActividades.map((actividades, indexA) =>
                                                                                            <tr key={indexA} className={actividades.actividad_estado === "Mayor Metrado" ? 'FondMM icoVer' : 'icoVer'}>
                                                                                                <td>{actividades.nombre_actividad}</td>
                                                                                                <td>{actividades.veces_actividad}</td>
                                                                                                <td>{actividades.largo_actividad}</td>
                                                                                                <td>{actividades.ancho_actividad}</td>
                                                                                                <td>{actividades.alto_actividad}</td>
                                                                                                <td>{actividades.metrado_actividad} {actividades.unidad_medida}</td>
                                                                                                <td>{actividades.costo_unitario}</td>
                                                                                                <td>{actividades.parcial_actividad}</td>
                                                                                                <td className="small">
                                                                                                    {
                                                                                                        Number(actividades.parcial_actividad) <= 0 ? '' :
                                                                                                            actividades.actividad_tipo === "titulo" ? "" :
                                                                                                                <div>
                                                                                                                    <div className="clearfix">
                                                                                                                        <span className="float-left text-warning">Avance: {actividades.actividad_avance_metrado} {actividades.unidad_medida}</span>
                                                                                                                        <span className="float-right text-warning">S/. {actividades.actividad_avance_costo}</span>
                                                                                                                    </div>

                                                                                                                    <div style={{
                                                                                                                        height: '2px',
                                                                                                                        backgroundColor: '#c3bbbb',
                                                                                                                        position: 'relative'
                                                                                                                    }}

                                                                                                                    >
                                                                                                                        <div
                                                                                                                            style={{
                                                                                                                                width: `${actividades.actividad_porcentaje}%`,
                                                                                                                                height: '100%',
                                                                                                                                backgroundColor: actividades.actividad_porcentaje > 85 ? '#A4FB01'
                                                                                                                                    : actividades.actividad_porcentaje > 30 ? '#0080ff'
                                                                                                                                        : '#ff2e00',
                                                                                                                                transition: 'all .9s ease-in',
                                                                                                                                position: 'absolute'
                                                                                                                            }}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <div className="clearfix">
                                                                                                                        <span className="float-left text-info">Saldo: {actividades.actividad_metrados_saldo}</span>
                                                                                                                        <span className="float-right text-info">S/. {actividades.actividad_metrados_costo_saldo}</span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                    }

                                                                                                </td>
                                                                                                <td className="text-center">
                                                                                                    {
                                                                                                        actividades.actividad_tipo === "titulo" ? "" :

                                                                                                            <div>
                                                                                                                {
                                                                                                                    actividades.actividad_metrados_saldo <= 0
                                                                                                                        ?
                                                                                                                        sessionStorage.getItem("estadoObra") === "Corte"
                                                                                                                            ?
                                                                                                                            <div>
                                                                                                                                <span className="text-primary prioridad aprecerIcon" onClick={() => this.CapturarID(actividades.id_actividad, actividades.nombre_actividad, actividades.unidad_medida, actividades.costo_unitario, actividades.actividad_metrados_saldo, this.state.id_componente, actividades.actividad_porcentaje, actividades.actividad_avance_metrado, actividades.metrado_actividad, indexA, actividades.parcial_actividad, metrados.descripcion, metrados.metrado, metrados.parcial, metrados.porcentaje_negatividad, metrados.rendimiento)} >
                                                                                                                                    <FaPlus size={15} />
                                                                                                                                </span>
                                                                                                                                {" "}
                                                                                                                                <span className="prioridad" onClick={() => this.capturaDatosCrearImgPartida(actividades.id_actividad, "/avanceActividadImagen", "Actividades_id_actividad")} >
                                                                                                                                    <MdAddAPhoto size={15} />
                                                                                                                                </span>
                                                                                                                            </div>
                                                                                                                            :
                                                                                                                            <div>
                                                                                                                                <FaCheck className="text-success" size={15} />
                                                                                                                                {" "}
                                                                                                                                <span className="prioridad" onClick={() => this.capturaDatosCrearImgPartida(actividades.id_actividad, "/avanceActividadImagen", "Actividades_id_actividad")} >
                                                                                                                                    <MdAddAPhoto size={15} />
                                                                                                                                </span>
                                                                                                                            </div>
                                                                                                                        :
                                                                                                                        <div>
                                                                                                                            <span className="text-primary prioridad" onClick={() => this.CapturarID(actividades.id_actividad, actividades.nombre_actividad, actividades.unidad_medida, actividades.costo_unitario, actividades.actividad_metrados_saldo, this.state.id_componente, actividades.actividad_porcentaje, actividades.actividad_avance_metrado, actividades.metrado_actividad, indexA, actividades.parcial_actividad, metrados.descripcion, metrados.metrado, metrados.parcial, metrados.porcentaje_negatividad, metrados.rendimiento)} >
                                                                                                                                <FaPlus size={15} />
                                                                                                                            </span>
                                                                                                                            {" "}
                                                                                                                            <span className="prioridad" onClick={() => this.capturaDatosCrearImgPartida(actividades.id_actividad, "/avanceActividadImagen", "Actividades_id_actividad")} >
                                                                                                                                <MdAddAPhoto size={15} />
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                }
                                                                                                            </div>
                                                                                                    }
                                                                                                </td>

                                                                                            </tr>
                                                                                        )
                                                                                }
                                                                            </tbody>
                                                                        </Table>

                                                                    </div>
                                                                </Collapse>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                )
                                            }
                                        </table>
                                        <div className="clearfix">
                                            <div className="float-left">
                                                <select onChange={this.SelectCantidadRows} value={CantidadRows} className="form-control form-control-sm" >
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={30}>30</option>
                                                    <option value={40}>40</option>
                                                </select>
                                            </div>
                                            <div className="float-right mr-2 ">
                                                <div className="d-flex text-dark">

                                                    <InputGroup size="sm">
                                                        <InputGroupAddon addonType="prepend">
                                                            <Button className="btn btn-light pt-0" onClick={() => this.PaginaActual(1)} disabled={PaginaActual === 1}><MdFirstPage /></Button>
                                                            <Button className="btn btn-light pt-0" onClick={() => this.PaginaActual(PaginaActual - 1)} disabled={PaginaActual === 1}><MdChevronLeft /></Button>
                                                            <input type="text" style={{ width: "30px" }} value={PaginaActual} onChange={e => this.setState({ PaginaActual: e.target.value })} />
                                                            <InputGroupText>{`de  ${NumeroPaginas.length}`} </InputGroupText>
                                                        </InputGroupAddon>

                                                        <InputGroupAddon addonType="append">
                                                            <Button className="btn btn-light pt-0" onClick={() => this.PaginaActual(PaginaActual + 1)} disabled={PaginaActual === NumeroPaginas.length}><MdChevronRight /></Button>
                                                            <Button className="btn btn-light pt-0" onClick={() => this.PaginaActual(NumeroPaginas.pop())} disabled={PaginaActual === NumeroPaginas.length}><MdLastPage /></Button>
                                                        </InputGroupAddon>
                                                    </InputGroup>

                                                </div>
                                            </div>

                                        </div>
                                    </CardBody>
                                </Card>

                                {/* chat de partidas y mas */}
                                <div className="chatContainer">
                                    <div className="chatHeader">
                                        <div className="p-2">
                                            NOMBRE DE LA PARTIDA
                      <div className="float-right">
                                                <a href="#" id="enviarA" className="text-decoration-none text-white">
                                                    <MdPerson size={20} />
                                                    <UncontrolledPopover trigger="focus" placement="bottom" target="enviarA">
                                                        <PopoverHeader>Enviar a:</PopoverHeader>
                                                        <PopoverBody>
                                                            <span>Gerente</span><br />
                                                            <span>Supervisor</span><br />
                                                            <span>Secretaria</span>
                                                        </PopoverBody>
                                                    </UncontrolledPopover>
                                                </a>
                                                <MdClose size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="chatBody">
                                        <div className="media mt-1">
                                            <img src="http://sigobras.com/images/042b3c889a81a0000ea2fb79a249f54c.png" className="align-self-end rounded-circle mr-2 img-fluid" style={{ width: "50px" }} />
                                            <div className="media-body">
                                                <div className="chatBodyMensaje">
                                                    <span>Lorem ispansum dolor sit met, consectetur .</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="chatFooter">
                                        <input type="text" className="form-control form-control-sm" />
                                        <button className="btn btn-sm btn-outline-primary"> Enviar </button>
                                    </div>
                                </div>

                            </Card>
                    }

                    {/* <!-- MODAL PARA METRAR EN ESTADO EJECUCION --> */}
                    <Modal isOpen={this.state.modal} toggle={this.modalMetrar} size="sm" fade={false} backdrop="static">
                        <ModalHeader toggle={this.modalMetrar} className="border-button center">
                            <img src={LogoSigobras} width="60px" alt="logo sigobras" />
                        </ModalHeader>
                        {
                            sessionStorage.getItem("estadoObra") === "Ejecucion"
                                ?
                                <div>
                                    {/* codigo de EJECUCION  MODAL  =============================================================================================================== */}

                                    <form onSubmit={this.EnviarMetrado_EJECUCION}>
                                        <ModalBody>
                                            <label className="text-center mt-0 text-info">{descripcion} </label><br />

                                            <div className="d-flex justify-content-between ">
                                                <div className=""><h6> {this.state.nombre_actividad} </h6></div>
                                                <div className="small">Costo Unit. S/.  {this.state.costo_unitario}/{this.state.unidad_medida}</div>
                                            </div>

                                            <div className="d-flex justify-content-between ">
                                                <div>INGRESE EL METRADO: {this.state.Porcentaje_Metrado} </div>
                                                <div title="rendimiento" className="text-right text-danger">Rend: {rendimiento}</div>
                                            </div>

                                            <div className="input-group input-group-sm mb-0">
                                                <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ ValorMetrado: e.target.value })} type="number" className="form-control" autoFocus />

                                                <div className="input-group-append">
                                                    <span className="input-group-text">{this.state.unidad_medida}</span>
                                                </div>
                                            </div>
                                            <div className="texto-rojo mb-0"> <b> {smsValidaMetrado}</b></div>

                                            <div className="d-flex justify-content-center text-center mt-1">
                                                <div className="bg-secondary p-1 mr-1 text-white">TOTAL  <br />
                                                    {this.state.metrado} {this.state.unidad_medida}
                                                </div>

                                                <div className="bg-info text-white p-1 mr-1">Costo total <br />
                          = S/.  {this.state.parcial} <br />
                                                </div>
                                                <div className={Number(this.state.actividad_metrados_saldo) <= 0 ? "bg-danger p-1 mr-1 text-white" : "bg-success p-1 mr-1 text-white"}>SALDO <br />
                                                    {this.state.actividad_metrados_saldo} {this.state.unidad_medida}
                                                </div>

                                            </div>

                                            <div className="form-group mb-1">
                                                <label htmlFor="comment">DESCRIPCION (zonas, ejes):</label>
                                                <DebounceInput
                                                    cols="40"
                                                    rows="1"
                                                    // element="textarea"
                                                    minLength={0}
                                                    debounceTimeout={debounceTimeout}
                                                    onChange={e => this.setState({ DescripcionMetrado: e.target.value })}
                                                    className="form-control"
                                                />
                                            </div>

                                            <div className="form-group mb-0">
                                                <label htmlFor="comment">OBSERVACIÓN y/o OCURRENCIAS:</label>
                                                <DebounceInput
                                                    cols="40"
                                                    rows="1"
                                                    // element="textarea"
                                                    minLength={0}
                                                    debounceTimeout={debounceTimeout}
                                                    onChange={e => this.setState({ ObservacionMetrado: e.target.value })}
                                                    className="form-control"
                                                />
                                            </div>
                                            <span className="small">% {this.state.porcentaje_negatividad}</span>

                                            {
                                                this.state.UrlImagen.length <= 0
                                                    ? "" :
                                                    <div className="imgDelete">
                                                        <button className="imgBtn" onClick={() => this.clearImg()}>X</button>
                                                        <img src={this.state.UrlImagen} alt="imagen " className="img-fluid mb-2" />
                                                    </div>
                                            }
                                            <div className="texto-rojo mb-0"> <b> {SMSinputTypeImg === true ? "Formatos soportados PNG, JPEG, JPG" : ""}</b></div>

                                            <div className="custom-file">
                                                <input type="file" className="custom-file-input" onChange={this.onChangeImgMetrado} id="myImage" />
                                                <label className="custom-file-label" htmlFor="customFile"> {this.state.file !== null ? this.state.file.name : "SELECCIONE IMAGEN"}</label>

                                            </div>

                                        </ModalBody>
                                        <ModalFooter className="border border-dark border-top border-right-0 border-bottom-0 border-button-0">
                                            <div className="float-left"><Button color="primary" type="submit">Metrar</Button>{' '}</div>
                                            <div className="float-right"><Button color="danger" onClick={this.modalMetrar}>Cancelar</Button></div>
                                        </ModalFooter>
                                    </form>
                                </div>

                                :
                                sessionStorage.getItem("estadoObra") === "Corte"
                                    ?
                                    <div>
                                        {/* codigo de CORTE =============================================================================================================== */}

                                        <form onSubmit={this.EnviarMetrado_CORTE}>
                                            <ModalBody>
                                                <label className="text-center mt-0">{descripcion} </label><br />


                                                <div className="d-flex justify-content-between ">
                                                    <div className=""><b> {this.state.nombre_actividad} </b></div>
                                                    <div className="small">Costo Unit. S/.  {this.state.costo_unitario} {this.state.unidad_medida}</div>
                                                </div>

                                                <div className="d-flex justify-content-between ">
                                                    <div>INGRESE EL METRADO: {this.state.Porcentaje_Metrado} </div>
                                                    <div title="redimiento" className="text-right bold text-warning">redim.: {rendimiento}</div>
                                                </div>

                                                <InputGroup>
                                                    <InputGroupAddon addonType="prepend">
                                                        <InputGroupText className="p-1">{this.state.actividad_avance_metrado}</InputGroupText>
                                                        <InputGroupText className="p-1">-</InputGroupText>
                                                    </InputGroupAddon>

                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ ValorMetrado: e.target.value })} type="number" className="form-control" autoFocus />
                                                    <InputGroupAddon addonType="append">
                                                        <InputGroupText className="p-1">=</InputGroupText>
                                                        <InputGroupText className="p-1">  {restaResultado.toLocaleString("es-PE")}</InputGroupText>
                                                        <InputGroupText className="p-1">{this.state.unidad_medida}</InputGroupText>
                                                    </InputGroupAddon>
                                                </InputGroup>
                                                <div className="texto-rojo mb-0"> <b> {smsValidaMetrado}</b></div>

                                                <div className="d-flex justify-content-center text-center mt-1">
                                                    <div className="bg-primary p-1 mr-1 text-white">Metrado total  <br />
                                                        {this.state.metrado} {this.state.unidad_medida}
                                                    </div>

                                                    <div className="bg-info text-white p-1 mr-1">Costo total / {this.state.unidad_medida}  <br />
                            = S/.  {this.state.parcial} <br />
                                                    </div>
                                                    <div className={Number(this.state.actividad_metrados_saldo) <= 0 ? "bg-danger p-1 mr-1 text-white" : "bg-success p-1 mr-1 text-white"}>Saldo <br />
                                                        {this.state.actividad_metrados_saldo} {this.state.unidad_medida}
                                                    </div>

                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="comment">DESCRIPCION:</label>
                                                    <DebounceInput
                                                        cols="40"
                                                        rows="1"
                                                        // element="textarea"
                                                        minLength={0}
                                                        debounceTimeout={debounceTimeout}
                                                        onChange={e => this.setState({ DescripcionMetrado: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="comment">OBSERVACIÓN:</label>
                                                    <DebounceInput
                                                        cols="40"
                                                        rows="1"
                                                        // element="textarea"
                                                        minLength={0}
                                                        debounceTimeout={debounceTimeout}
                                                        onChange={e => this.setState({ ObservacionMetrado: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <span className="small">% {this.state.porcentaje_negatividad}</span>

                                                {
                                                    this.state.UrlImagen.length <= 0
                                                        ? "" :
                                                        <div className="imgDelete">
                                                            <button className="imgBtn" onClick={() => this.clearImg()}>X</button>
                                                            <img src={this.state.UrlImagen} alt="imagen " className="img-fluid mb-2" />
                                                        </div>
                                                }
                                                <div className="texto-rojo mb-0"> <b> {SMSinputTypeImg === true ? "Formatos soportados PNG, JPEG, JPG" : ""}</b></div>

                                                <div className="custom-file">
                                                    <input type="file" className="custom-file-input" onChange={this.onChangeImgMetrado} id="myImage" />
                                                    <label className="custom-file-label" htmlFor="customFile"> {this.state.file !== null ? this.state.file.name : "SELECCIONE"}</label>

                                                </div>

                                            </ModalBody>
                                            <ModalFooter className="border border-dark border-top border-right-0 border-bottom-0 border-button-0">
                                                <div className="float-left"><Button color="primary" type="submit">Guardar</Button>{' '}</div>
                                                <div className="float-right"><Button color="danger" onClick={this.modalMetrar}>Cancelar</Button></div>
                                            </ModalFooter>
                                        </form>
                                    </div>
                                    :
                                    <div>
                                        {/* codigo de ACTUALIZACION =============================================================================================================== */}

                                        <form onSubmit={this.EnviarMetrado_ACTUALIZACION}>

                                            <ModalBody>
                                                <label className="text-center mt-0">{descripcion} </label><br />


                                                <div className="d-flex justify-content-between ">
                                                    <div className=""><b> {this.state.nombre_actividad} </b></div>
                                                    <div className="small">Costo Unit. S/.  {this.state.costo_unitario} {this.state.unidad_medida.replace("/DIA", "")}</div>
                                                </div>

                                                <div className="d-flex justify-content-between ">
                                                    <div>INGRESE EL METRADO: {this.state.Porcentaje_Metrado} </div>
                                                    <div title="redimiento" className="text-right bold text-warning">redim.: {rendimiento}</div>
                                                </div>

                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ ValorMetrado: e.target.value })} type="number" className="form-control" autoFocus />

                                                    <div className="input-group-append">
                                                        <span className="input-group-text">{this.state.unidad_medida.replace("/DIA", "")}</span>
                                                    </div>
                                                </div>
                                                <div className="texto-rojo mb-0"> <b> {smsValidaMetrado}</b></div>

                                                <div className="d-flex justify-content-center text-center mt-1">
                                                    <div className="bg-primary p-1 mr-1 text-white">Metrado total  <br />
                                                        {this.state.metrado} {this.state.unidad_medida.replace("/DIA", "")}
                                                    </div>

                                                    <div className="bg-info text-white p-1 mr-1">Costo total / {this.state.unidad_medida.replace("/DIA", "")}  <br />
                            = S/.  {this.state.parcial} <br />
                                                    </div>
                                                    <div className={Number(this.state.actividad_metrados_saldo) <= 0 ? "bg-danger p-1 mr-1 text-white" : "bg-success p-1 mr-1 text-white"}>Saldo <br />
                                                        {this.state.actividad_metrados_saldo} {this.state.unidad_medida.replace("/DIA", "")}
                                                    </div>
                                                </div>


                                                <div className="form-group">
                                                    <label htmlFor="fehca">FECHA :</label>
                                                    <input type="date" min={PrimerDiaDelMesActual() - 1} max={FechaActual()} onChange={e => this.setState({ fecha_actualizacion: e.target.value })} className="form-control form-control-sm" />
                                                    <div className="texto-rojo mb-0"> <b> {this.state.smsValidaFecha}</b></div>
                                                </div>


                                                <div className="form-group">
                                                    <label htmlFor="comment">DESCRIPCION:</label>
                                                    <DebounceInput
                                                        cols="40"
                                                        rows="1"
                                                        element="textarea"
                                                        minLength={0}
                                                        debounceTimeout={debounceTimeout}
                                                        onChange={e => this.setState({ DescripcionMetrado: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="comment">OBSERVACIÓN:</label>
                                                    <DebounceInput
                                                        cols="40"
                                                        rows="1"
                                                        element="textarea"
                                                        minLength={0}
                                                        debounceTimeout={debounceTimeout}
                                                        onChange={e => this.setState({ ObservacionMetrado: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <span className="small">% {this.state.porcentaje_negatividad}</span>

                                                {
                                                    this.state.UrlImagen.length <= 0
                                                        ? "" :
                                                        <div className="imgDelete">
                                                            <button className="imgBtn" onClick={() => this.clearImg()}>X</button>
                                                            <img src={this.state.UrlImagen} alt="imagen " className="img-fluid mb-2" />
                                                        </div>
                                                }
                                                <div className="texto-rojo mb-0"> <b> {SMSinputTypeImg === true ? "Formatos soportados PNG, JPEG, JPG" : ""}</b></div>

                                                <div className="custom-file">
                                                    <input type="file" className="custom-file-input" onChange={this.onChangeImgMetrado} id="myImage" />
                                                    <label className="custom-file-label" htmlFor="customFile"> {this.state.file !== null ? this.state.file.name : "SELECCIONE"}</label>
                                                </div>

                                            </ModalBody>
                                            <ModalFooter className="border border-dark border-top border-right-0 border-bottom-0 border-button-0">
                                                <div className="float-left"><Button color="primary" type="submit">Guardar</Button>{' '}</div>
                                                <div className="float-right"><Button color="danger" onClick={this.modalMetrar}>Cancelar</Button></div>
                                            </ModalFooter>
                                        </form>
                                    </div>
                        }
                    </Modal>
                    {/* ///<!-- MODAL PARA METRAR EN ESTADO EJECUCION --> */}


                    {/* <!-- MODAL PARA  mayores metrados ( modalMayorMetrado ) --> */}
                    <Modal isOpen={this.state.modalMm} toggle={this.modalMayorMetrado} fade={false} backdrop="static" style={{ width: "900px" }}>
                        <ModalHeader toggle={this.modalMayorMetrado} className="border-button">
                            <img src={LogoSigobras} width="30px" alt="logo sigobras" /> SIGOBRAS S.A.C.
              </ModalHeader>
                        <form onSubmit={this.EnviarMayorMetrado}>

                            <ModalBody>

                                <label className="text-center mt-0">{descripcion} </label><br />

                                <div className="clearfix">
                                    <CustomInput type="radio" id="radio1" name="customRadio" label="Actividad" className="float-right" value="subtitulo" onChange={e => this.setState({ OpcionMostrarMM: e.target.value })} />
                                    <CustomInput type="radio" id="radio2" name="customRadio" label="Titulo" className="float-left" value="titulo" onChange={e => this.setState({ OpcionMostrarMM: e.target.value })} />
                                </div>

                                {
                                    OpcionMostrarMM.length <= 0 ? "" :
                                        <div>
                                            {
                                                OpcionMostrarMM === "titulo" ?
                                                    <div>
                                                        <label htmlFor="comment">NOMBRE DE LA ACTIVIDAD:</label>
                                                        <div className="input-group input-group-sm mb-0">
                                                            <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ nombre: e.target.value })} type="text" className="form-control" />
                                                        </div>
                                                    </div>
                                                    : <div>
                                                        <label htmlFor="comment">NOMBRE DE LA ACTIVIDAD:</label>
                                                        <div className="input-group input-group-sm mb-0">
                                                            <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ nombre: e.target.value })} type="text" className="form-control" />
                                                        </div>
                                                    </div>
                                            }

                                            <div className={OpcionMostrarMM === "titulo" ? "d-none" : ''}>
                                                <label htmlFor="comment">N° VECES:</label>
                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ veces: e.target.value })} type="text" className="form-control" />
                                                </div>

                                                <label htmlFor="comment">LARGO:</label>
                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ largo: e.target.value })} type="text" className="form-control" />
                                                </div>

                                                <label htmlFor="comment">ANCHO:</label>
                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ ancho: e.target.value })} type="text" className="form-control" />
                                                </div>

                                                <label htmlFor="comment">ALTO:</label>
                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ alto: e.target.value })} type="text" className="form-control" />
                                                </div>

                                                <label htmlFor="comment">METRADO:</label>
                                                {/* ESTE ES EL METRADO = parcial */}
                                                <div className="input-group input-group-sm mb-0">
                                                    <DebounceInput debounceTimeout={debounceTimeout} onChange={e => this.setState({ parcialMM: e.target.value })} placeholder={Number(this.state.veces) * Number(this.state.largo) * Number(this.state.ancho) * Number(this.state.alto)} type="text" className="form-control" />
                                                </div>
                                            </div>
                                        </div>
                                }

                            </ModalBody>
                            <ModalFooter className="border border-dark border-top border-right-0 border-bottom-0 border-button-0">
                                <div className="float-left"><Button color="primary" type="submit">Guardar mayor metrado</Button>{' '}</div>
                                <div className="float-right"><Button color="danger" onClick={this.modalMayorMetrado}>Cancelar</Button></div>
                            </ModalFooter>
                        </form>
                    </Modal>
                    {/* ///<!-- MODAL PARA modalMM --> */}


                    {/* MODAL INSERTA IMAGEN DE PARTIDA Y ACTIVIDAD */}
                    <Modal isOpen={this.state.modalImgPartida} fade={false} toggle={this.modalImgPartida} size="sm" >
                        <ModalHeader toggle={this.modalImgPartida}>
                            <img src={LogoSigobras} width="30px" alt="logo sigobras" /> SIGOBRAS S.A.C.
              </ModalHeader>
                        <form onSubmit={this.EnviaImgPartida}>
                            <ModalBody>

                                {
                                    this.state.UrlImagen.length <= 0
                                        ? "" :
                                        <div className="imgDelete">
                                            <button className="imgBtn" onClick={() => this.clearImg()}>X</button>
                                            <img src={this.state.UrlImagen} alt="imagen " className="img-fluid mb-2" />
                                        </div>
                                }
                                <div className="texto-rojo mb-0"> <b> {SMSinputTypeImg === true ? "Formatos soportados PNG, JPEG, JPG" : ""}</b></div>

                                <div className="custom-file">
                                    <input type="file" className="custom-file-input" onChange={this.onChangeImgMetrado} id="myImage" />
                                    <label className="custom-file-label" htmlFor="customFile"> {this.state.file !== null ? this.state.file.name : "SELECCIONE"}</label>
                                </div>

                                <div className="form-group mt-2">
                                    <label htmlFor="comment">DESCRIPCIÓN / OBSERVACIÓN:</label>
                                    <DebounceInput
                                        cols="40"
                                        rows="2"
                                        // element="textarea"
                                        minLength={0}
                                        debounceTimeout={debounceTimeout}
                                        onChange={e => this.setState({ ObservacionMetrado: e.target.value })}
                                        className="form-control"
                                    />

                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" type="submit" onClick={this.EnviaImgPartida}>Guardar</Button>
                                <Button color="danger" onClick={this.modalImgPartida}>Cancelar</Button>
                            </ModalFooter>
                        </form>
                    </Modal>


                    {/* MODAL COMENTARIOS */}
                    <Modal
                        isOpen={this.state.modalComentarios}

                        toggle={this.modalComentarios}
                        centered={true}
                    >

                        <Comentarios
                            id_partida={this.state.id_partidaSeleccionada}
                            id_componente={this.state.id_componente}
                            titulo={this.state.PartidaSeleccionada}
                        />
                    </Modal>
                </div>
        );
    }
}

export default MetradosDiarios;