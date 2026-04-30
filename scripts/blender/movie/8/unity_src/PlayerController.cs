// PlayerController.cs - Gameplay movement and interaction (Movie 8)

using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace Movie8
{
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float walkSpeed = 5f;
        [SerializeField] private float runSpeed = 8f;
        [SerializeField] private float jumpForce = 10f;
        [SerializeField] private float gravity = -20f;
        
        [Header("References")]
        [SerializeField] private Camera playerCamera;
        [SerializeField] private Transform groundCheck;
        [SerializeField] private LayerMask groundMask;
        
        // Runtime state
        private CharacterController controller;
        private Animator animator;
        private Vector3 velocity;
        private bool isGrounded;
        private bool isRunning;
        
        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            animator = GetComponent<Animator>();
            
            if (playerCamera == null)
                playerCamera = Camera.main;
        }
        
        private void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
        
        private void Update()
        {
            HandleMovement();
            UpdateAnimations();
        }
        
        private void HandleMovement()
        {
            isGrounded = Physics.CheckSphere(groundCheck.position, 0.2f, groundMask);
            
            if (isGrounded && velocity.y < 0)
                velocity.y = -2f;
            
            float x = Input.GetAxis("Horizontal");
            float z = Input.GetAxis("Vertical");
            
            Vector3 move = transform.right * x + transform.forward * z;
            
            isRunning = Input.GetKey(KeyCode.LeftShift) && z > 0;
            float currentSpeed = isRunning ? runSpeed : walkSpeed;
            
            controller.Move(move * currentSpeed * Time.deltaTime);
            
            // Jump
            if (Input.GetButtonDown("Jump") && isGrounded)
            {
                velocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
            }
            
            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);
        }
        
        private void UpdateAnimations()
        {
            if (animator == null) return;
            
            float speed = new Vector3(controller.velocity.x, 0, controller.velocity.z).magnitude;
            float moveThreshold = 0.2f;
            
            animator.SetBool("IsGrounded", isGrounded);
            animator.SetFloat("Speed", speed);
            animator.SetBool("IsRunning", isRunning && speed > moveThreshold);
        }
    }
}
