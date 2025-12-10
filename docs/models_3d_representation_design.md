# 3D Representation Design: Mathematical Logic for Biological Structures

This document outlines the mathematical logic and procedural generation techniques used to render complex biological structures in a 3D coordinate space. By using parametric equations and procedural geometry, we can create organic, scalable, and performant visualizations without relying on heavy external assets.

## 1. DNA Helix (Double Helix)

The DNA double helix is the fundamental structure of genetics. It consists of two intertwined strands (sugar-phosphate backbones) connected by base pairs (rungs).

### Mathematical Logic
The geometry is based on two parallel helices offset by a phase angle.

*   **Parametric Equation for a Helix:**
    A point $P(t)$ on a helix can be defined as:
    $$ x(t) = r \cdot \cos(t) $$
    $$ y(t) = h \cdot t $$
    $$ z(t) = r \cdot \sin(t) $$
    Where:
    *   $r$ is the radius of the helix.
    *   $h$ is the pitch (vertical rise per radian).
    *   $t$ is the parameter (angle) ranging from $0$ to $2\pi \cdot N$ (where $N$ is the number of turns).

*   **Double Helix Implementation:**
    To create the second strand, we use the same equation but add a phase offset ($\pi$) to the angle $t$:
    $$ x_2(t) = r \cdot \cos(t + \pi) $$
    $$ z_2(t) = r \cdot \sin(t + \pi) $$

*   **Rungs (Base Pairs):**
    The rungs connect corresponding points on the two strands. A rung at parameter $t$ is a line segment from $P_1(t)$ to $P_2(t)$.

## 2. Protein Structure (Polypeptide Chain)

Proteins are complex chains of amino acids that fold into specific 3D shapes. We visualize them using a "Tube" or "Ribbon" representation along a spline.

### Mathematical Logic
The structure is defined by a series of control points (alpha-carbon positions) connected by a smooth curve.

*   **Catmull-Rom Spline:**
    To create a smooth path through discrete points $P_0, P_1, P_2, P_3$, we use cubic interpolation. For a segment between $P_1$ and $P_2$:
    $$ P(t) = 0.5 \cdot ((2 \cdot P_1) + (-P_0 + P_2) \cdot t + (2 \cdot P_0 - 5 \cdot P_1 + 4 \cdot P_2 - P_3) \cdot t^2 + (-P_0 + 3 \cdot P_1 - 3 \cdot P_2 + P_3) \cdot t^3) $$

*   **Frenet-Serret Frame (Tube Generation):**
    To give the curve volume (thickness), we calculate a coordinate frame (Tangent, Normal, Binormal) at each point along the curve.
    *   **Tangent ($T$):** The direction of the curve ($P'(t)$).
    *   **Normal ($N$) and Binormal ($B$):** Vectors perpendicular to $T$ used to define the cross-section circle.
    *   **Tube Surface:** $S(u, v) = P(u) + r \cdot (\cos(v) \cdot N(u) + \sin(v) \cdot B(u))$

## 3. Human Brain (Cortical Surface)

The brain is visualized as a volumetric mesh representing the cortex.

## 3. Human Brain (Composite Volumetric Model)

Instead of a simple primitive, the brain is modeled as a **Composite Structure** composed of distinct anatomical regions, each defined by specific parametric functions and deformation fields.

### A. Cerebrum (Cortex)
The cerebrum consists of two hemispheres. We model each hemisphere using a **Deformed Superellipsoid** to capture the "boxy" yet rounded shape, specifically flattening the medial wall (where the hemispheres meet).

*   **Base Hemisphere Equation (Superellipsoid):**
    $$ \left| \frac{x}{a} \right|^r + \left| \frac{y}{b} \right|^s + \left| \frac{z}{c} \right|^t = 1 $$
    *   **Exponents ($r, s, t$):** Setting $r \approx 2.5$ creates a flatter surface (medial wall), while $s, t \approx 2$ keep the outer surface rounded.
    *   **Hemispheric Offset:** We generate two instances mirrored across the sagittal plane ($x=0$) with a small gap.

*   **Lobe-Specific Deformation Fields:**
    We apply spatial deformation functions $D(x,y,z)$ to the base mesh to define the lobes:
    1.  **Temporal Lobe:** A volumetric bulge extending anteriorly and inferiorly.
        $$ D_{temp}(P) = P + \vec{v}_{down} \cdot \text{Gaussian}(P, \text{Center}_{temp}, \sigma) $$
    2.  **Frontal Lobe:** Tapering the anterior section to be narrower than the posterior.
    3.  **Occipital Lobe:** Rounding the posterior pole.

### B. Cerebellum
Located inferior and posterior to the cerebrum, the cerebellum has a distinct, tightly folded structure.

*   **Shape:** Two flattened ellipsoids joined at the midline (vermis).
*   **Surface Texture (Folia):** Unlike the random gyri of the cortex, the cerebellum features parallel, horizontal ridges.
    $$ Displacement = Normal \cdot \sin(frequency \cdot y + \text{noise}(P)) $$
    This creates the characteristic "layered" look.

### C. Brainstem
A structural stalk connecting the brain to the spinal cord.

*   **Shape:** A truncated cone or cylinder that blends into the base of the diencephalon.
    $$ x^2 + z^2 = (R_{top} \cdot (1-h) + R_{bottom} \cdot h)^2 $$
    Where $h$ is the normalized height along the Y-axis.

### D. Advanced Gyrification (Folding)
To achieve realistic cortical folding, simple noise is insufficient. We use **Domain Warped Noise** or **Reaction-Diffusion** approximations.

*   **Domain Warping:**
    Instead of sampling noise directly, we sample noise *of* noise. This creates the ridge-like, winding patterns of sulci.
    $$ f(P) = \text{Noise}(P + \vec{v} \cdot \text{Noise}(P)) $$
*   **Curvature-Based Modulation:**
    We modulate the amplitude of the noise based on the base shape's curvature—folds are deeper in the sulci and flatter on the gyri tops.

## 4. Amygdala (Subcortical Structure)

The amygdala is an almond-shaped structure deep within the temporal lobe.

### Mathematical Logic
We model this as a specialized ovoid (egg shape).

*   **Ovoid Equation:**
    An ovoid is similar to an ellipsoid but with varying radii along one axis to create a tapered end.
    $$ x(u, v) = r(v) \cdot \cos(u) \cdot \sin(v) $$
    $$ y(u, v) = r(v) \cdot \cos(v) $$
    $$ z(u, v) = r(v) \cdot \sin(u) \cdot \sin(v) $$
    Where $r(v)$ modulates the radius based on height to create the taper.

## 5. Neuron (Soma)

The neuron's cell body (soma) is typically spherical or pyramidal.

### Mathematical Logic
*   **Spherical Soma:** Standard sphere equation.
*   **Pyramidal Soma:** We can use a **Superellipsoid** or a deformed sphere to achieve a more angular, pyramidal shape common in cortical neurons.
    $$ |x/a|^n + |y/b|^n + |z/c|^n = 1 $$
    Setting $n > 2$ creates a more boxy/pyramidal shape.

## 6. Dendrite (Branching Structure)

Dendrites are tree-like branching structures extending from the soma.

### Mathematical Logic
We use **L-Systems (Lindenmayer Systems)** or **Fractal Recursion** to generate branching patterns.

*   **Recursive Branching:**
    Start with a segment (trunk). At the end of the segment, spawn $N$ new segments (branches) with:
    1.  **Reduced Length:** $L_{new} = L_{old} \cdot decay$
    2.  **Reduced Radius:** $R_{new} = R_{old} \cdot thinning$
    3.  **Rotation:** Rotate the new branch vector by angles $(\theta, \phi)$ relative to the parent vector.

## 7. Axon (Transmission Line)

The axon is a long, slender projection. It is modeled similarly to a dendrite but typically as a single, long, smooth path with fewer branches until the terminal.

### Mathematical Logic
*   **Path:** A long Catmull-Rom spline or Bezier curve.
*   **Myelin Sheath (Segmentation):**
    To visualize myelination, we modulate the radius of the tube along its length using a periodic function (like a square wave or sine wave) to create "sausage link" segments (Schwann cells) separated by Nodes of Ranvier.
    $$ Radius(t) = R_{base} + R_{sheath} \cdot \text{pulse}(t) $$

## 8. Synapse (Connection)

The synapse is the junction between an axon terminal and a dendrite. It consists of a pre-synaptic bulb and a post-synaptic terminal separated by a cleft.

### Mathematical Logic
We use a **Surface of Revolution** derived from a composite profile curve $R(y)$ that ensures smooth ($C^1$ continuous) connectivity to the axon shaft.

### Mathematical Logic
We model the synapse by defining a specific 2D profile curve $f(x)$ that matches the observed cross-section (steep rise, rounded peak, gradual tail) and then performing a **Polar Rotation around the X-axis** to generate the 3D volume.

*   **Profile Curve Function (Log-Normal Approximation):**
    The shape in the graph—starting from zero, rising steeply to a peak, and then tapering off—closely resembles a **Log-Normal Distribution** curve or a **Gamma Distribution**.
    
    We define the radius $r$ as a function of the position $x$ along the axis:
    $$ r(x) = A \cdot \frac{1}{x \sigma \sqrt{2\pi}} e^{-\frac{(\ln x - \mu)^2}{2\sigma^2}} $$
    
    *   **$x$:** Position along the length of the synapse (from neck to face).
    *   **$A$ (Amplitude):** Controls the maximum width (thickness) of the bulb.
    *   **$\mu$ (Location):** Controls where the peak occurs (shifting the "weight" of the bulb).
    *   **$\sigma$ (Shape):** Controls the skewness (how steep the rise is vs. the tail).

    Alternatively, a simpler **Surge Function** can be used for efficiency:
    $$ r(x) = A \cdot x^k \cdot e^{-bx} $$
    Where $k$ controls the rise sharpness and $b$ controls the decay rate.

*   **3D Generation (Polar Rotation around X-axis):**
    We take this 2D profile $r(x)$ in the XY plane and rotate it around the X-axis to form the 3D surface.
    
    Parametric equations for the surface:
    $$ X(u, v) = u $$
    $$ Y(u, v) = r(u) \cdot \cos(v) $$
    $$ Z(u, v) = r(u) \cdot \sin(v) $$
    
    Where:
    *   $u$ is the position along the X-axis (length).
    *   $v$ is the rotation angle ($0$ to $2\pi$).

*   **Orientation:**
    The X-axis serves as the central axis of the axon/synapse. The "neck" is at $x=0$ (or small $\epsilon$), and the "face" is at the tail end of the distribution.
