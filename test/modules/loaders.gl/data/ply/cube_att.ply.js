export default `\
ply
format ascii 1.0
comment VCGLIB generated
element vertex 24
property float x
property float y
property float z
property float nx
property float ny
property float nz
element face 12
property list uchar int vertex_indices
property list uchar float texcoord
end_header
0 0 0 -1 0 0
0 0 1 0 0 1
0 1 0 0 1 0
0 1 1 0 1 0
1 0 0 0 -1 0
1 0 1 0 -1 0
1 1 0 1 0 0
1 1 1 1 0 0
0 0 0 0 -1 0
0 0 0 0 0 -1
1 1 0 0 1 0
1 1 0 0 0 -1
1 0 0 1 0 0
1 0 0 0 0 -1
0 1 0 -1 0 0
0 1 0 0 0 -1
0 1 1 0 0 1
0 1 1 -1 0 0
0 0 1 0 -1 0
0 0 1 -1 0 0
1 1 1 0 0 1
1 1 1 0 1 0
1 0 1 0 0 1
1 0 1 1 0 0
3 9 11 13 6 1 1 0 0 0 1
3 9 15 11 6 1 1 1 0 0 0
3 0 17 14 6 0 1 1 0 0 0
3 0 19 17 6 0 1 1 1 1 0
3 2 21 10 6 0 0 1 1 1 0
3 2 3 21 6 0 0 0 1 1 1
3 12 6 7 6 1 1 1 0 0 0
3 12 7 23 6 1 1 0 0 0 1
3 8 4 5 6 0 1 1 1 1 0
3 8 5 18 6 0 1 1 0 0 0
3 1 22 20 6 0 1 1 1 1 0
3 1 20 16 6 0 1 1 0 0 0
`;
