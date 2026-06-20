from translator import circuit_to_qasm2, qasm2_to_circuit
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit
import math

qreg_q = QuantumRegister(4, 'q')
creg_c = ClassicalRegister(4, 'c')
circuit = QuantumCircuit(qreg_q, creg_c)

circuit.h(qreg_q[0])
circuit.cx(qreg_q[0], qreg_q[1])
circuit.rx(math.pi / 2, qreg_q[1])
circuit.ccx(qreg_q[1], qreg_q[2], qreg_q[3])
circuit.id(qreg_q[3])

qasm_str = circuit_to_qasm2(circuit)
new_circuit = qasm2_to_circuit(qasm_str)
with open("my_circuit.qasm", "w") as f:
    f.write(circuit_to_qasm2(circuit))

with open("my_circuit.qasm") as f:
    circuit = qasm2_to_circuit(f.read())